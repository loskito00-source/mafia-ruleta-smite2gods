import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from './supabase'
import { uploadBuildImage } from './cloudinary'
import type { Build } from '../types'

export const BUILDS_KEY = ['builds'] as const

interface BuildRow {
  id: string
  image_url: string
  title: string | null
  created_at: string
  build_gods: { god_id: string }[] | null
}

export async function fetchBuilds(): Promise<Build[]> {
  const { data, error } = await supabase
    .from('builds')
    .select('id, image_url, title, created_at, build_gods(god_id)')
    .order('created_at', { ascending: false })
    .returns<BuildRow[]>()
  if (error) throw error
  return (data ?? []).map((b) => ({
    id: b.id,
    imageUrl: b.image_url,
    title: b.title,
    createdAt: b.created_at,
    godIds: (b.build_gods ?? []).map((g) => g.god_id),
  }))
}

/**
 * Trae todas las builds una vez y cachea; el filtro por dios se hace en
 * memoria (ver BuildsPage), así cambiar de dios es instantáneo y no dispara
 * una consulta nueva cada vez.
 */
export function useBuilds() {
  return useQuery({ queryKey: BUILDS_KEY, queryFn: fetchBuilds, staleTime: 60_000 })
}

async function fetchBuildById(id: string): Promise<Build | null> {
  const { data, error } = await supabase
    .from('builds')
    .select('id, image_url, title, created_at, build_gods(god_id)')
    .eq('id', id)
    .maybeSingle()
    .returns<BuildRow | null>()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    imageUrl: data.image_url,
    title: data.title,
    createdAt: data.created_at,
    godIds: (data.build_gods ?? []).map((g) => g.god_id),
  }
}

/**
 * El INSERT de `builds` llega por realtime antes de que termine el segundo
 * insert (las filas de `build_gods`, ver useCreateBuild): sin esto la build
 * aparecería un instante sin sus dioses. Un solo reintento corto alcanza,
 * porque ambos inserts los dispara el mismo cliente en la misma request.
 */
async function fetchBuildByIdWithGods(id: string): Promise<Build | null> {
  const first = await fetchBuildById(id)
  if (first && first.godIds.length > 0) return first
  await new Promise((resolve) => setTimeout(resolve, 400))
  const second = await fetchBuildById(id)
  return second ?? first
}

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected'

/**
 * Suscribe por websocket (Supabase Realtime) a los inserts/deletes de
 * `builds` y actualiza el cache de react-query en el momento, sin refetch
 * completo: así todos los que tengan la página abierta ven aparecer las
 * builds nuevas al instante, las hayan subido ellos o no.
 */
export function useBuildsRealtime(): RealtimeStatus {
  const qc = useQueryClient()
  const [status, setStatus] = useState<RealtimeStatus>('connecting')

  useEffect(() => {
    if (!supabaseConfigured) return
    setStatus('connecting')

    const channel = supabase
      .channel('builds-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'builds' },
        (payload) => {
          const id = (payload.new as { id: string }).id
          fetchBuildByIdWithGods(id).then((build) => {
            if (!build) return
            qc.setQueryData<Build[]>(BUILDS_KEY, (old) => {
              if (!old) return [build]
              if (old.some((b) => b.id === build.id)) return old
              return [build, ...old]
            })
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'builds' },
        (payload) => {
          const id = (payload.old as { id: string }).id
          qc.setQueryData<Build[]>(BUILDS_KEY, (old) => old?.filter((b) => b.id !== id))
        },
      )
      .subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') setStatus('connected')
        else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT' || subStatus === 'CLOSED') {
          setStatus('disconnected')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])

  return status
}

interface CreateBuildInput {
  file: File
  godIds: string[]
  title?: string
  onProgress?: (pct: number) => void
}

export function useCreateBuild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, godIds, title, onProgress }: CreateBuildInput): Promise<Build> => {
      const { url, publicId } = await uploadBuildImage(file, onProgress)

      const { data: build, error } = await supabase
        .from('builds')
        .insert({ image_url: url, image_public_id: publicId, title: title?.trim() || null })
        .select('id, image_url, title, created_at')
        .single()
      if (error) throw error

      const rows = godIds.map((god_id) => ({ build_id: build.id, god_id }))
      const { error: linkError } = await supabase.from('build_gods').insert(rows)
      if (linkError) throw linkError

      return {
        id: build.id,
        imageUrl: build.image_url,
        title: build.title,
        createdAt: build.created_at,
        godIds,
      }
    },
    onSuccess: (newBuild) => {
      qc.setQueryData<Build[]>(BUILDS_KEY, (old) => (old ? [newBuild, ...old] : [newBuild]))
    },
  })
}
