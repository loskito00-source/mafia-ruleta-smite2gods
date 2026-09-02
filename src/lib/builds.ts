import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from './supabase'
import { uploadBuildImage } from './cloudinary'
import { getDeviceId } from './deviceId'
import { markAsMine, unmarkMine } from './myBuilds'
import type { Build, Reaction } from '../types'

export const BUILDS_KEY = ['builds'] as const

interface BuildRow {
  id: string
  image_url: string
  title: string | null
  created_at: string
  build_gods: { god_id: string }[] | null
  build_reactions: { god_id: string; emoji: string; voter_id: string }[] | null
}

function mapRow(b: BuildRow): Build {
  return {
    id: b.id,
    imageUrl: b.image_url,
    title: b.title,
    createdAt: b.created_at,
    godIds: (b.build_gods ?? []).map((g) => g.god_id),
    reactions: (b.build_reactions ?? []).map((r) => ({ godId: r.god_id, emoji: r.emoji, voterId: r.voter_id })),
  }
}

const BUILD_SELECT =
  'id, image_url, title, created_at, build_gods(god_id), build_reactions(god_id, emoji, voter_id)'

export async function fetchBuilds(): Promise<Build[]> {
  const { data, error } = await supabase
    .from('builds')
    .select(BUILD_SELECT)
    .order('created_at', { ascending: false })
    .returns<BuildRow[]>()
  if (error) throw error
  return (data ?? []).map(mapRow)
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
    .select(BUILD_SELECT)
    .eq('id', id)
    .maybeSingle()
    .returns<BuildRow | null>()
  if (error) throw error
  return data ? mapRow(data) : null
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
 * Suscribe por websocket (Supabase Realtime) a los cambios de `builds` y
 * `build_reactions` y actualiza el cache de react-query en el momento, sin
 * refetch completo: así todos los que tengan la página abierta ven aparecer
 * builds nuevas, ediciones y reacciones al instante, las hayan hecho ellos
 * o no.
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
        { event: 'UPDATE', schema: 'public', table: 'builds' },
        (payload) => {
          const id = (payload.new as { id: string }).id
          fetchBuildById(id).then((build) => {
            if (!build) return
            qc.setQueryData<Build[]>(BUILDS_KEY, (old) => old?.map((b) => (b.id === id ? build : b)))
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
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'build_reactions' },
        (payload) => {
          const row = payload.new as { build_id: string; god_id: string; emoji: string; voter_id: string }
          qc.setQueryData<Build[]>(BUILDS_KEY, (old) =>
            old?.map((b) => {
              if (b.id !== row.build_id) return b
              if (b.reactions.some((r) => r.godId === row.god_id && r.emoji === row.emoji && r.voterId === row.voter_id)) {
                return b
              }
              return { ...b, reactions: [...b.reactions, { godId: row.god_id, emoji: row.emoji, voterId: row.voter_id }] }
            }),
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'build_reactions' },
        (payload) => {
          const row = payload.old as { build_id: string; god_id: string; emoji: string; voter_id: string }
          qc.setQueryData<Build[]>(BUILDS_KEY, (old) =>
            old?.map((b) =>
              b.id === row.build_id
                ? {
                    ...b,
                    reactions: b.reactions.filter(
                      (r) => !(r.godId === row.god_id && r.emoji === row.emoji && r.voterId === row.voter_id),
                    ),
                  }
                : b,
            ),
          )
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

      const { error: ownerError } = await supabase
        .from('build_owners')
        .insert({ build_id: build.id, owner_token: getDeviceId() })
      if (ownerError) throw ownerError

      return {
        id: build.id,
        imageUrl: build.image_url,
        title: build.title,
        createdAt: build.created_at,
        godIds,
        reactions: [],
      }
    },
    onSuccess: (newBuild) => {
      markAsMine(newBuild.id)
      qc.setQueryData<Build[]>(BUILDS_KEY, (old) => {
        if (!old) return [newBuild]
        if (old.some((b) => b.id === newBuild.id)) return old
        return [newBuild, ...old]
      })
    },
  })
}

interface UpdateBuildInput {
  buildId: string
  title: string
  godIds: string[]
  /** Si se pasa, reemplaza la foto de la build (se sube antes de guardar). */
  file?: File | null
  onProgress?: (pct: number) => void
}

/** Solo funciona si este dispositivo subió la build; lo valida api/update-build.ts. */
export function useUpdateBuild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ buildId, title, godIds, file, onProgress }: UpdateBuildInput) => {
      const image = file ? await uploadBuildImage(file, onProgress) : null

      const res = await fetch('/api/update-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildId,
          ownerToken: getDeviceId(),
          title,
          godIds,
          imageUrl: image?.url,
          imagePublicId: image?.publicId,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'No se pudieron guardar los cambios.')
      }
      return { buildId, title: title.trim() || null, godIds, imageUrl: image?.url }
    },
    onSuccess: ({ buildId, title, godIds, imageUrl }) => {
      qc.setQueryData<Build[]>(BUILDS_KEY, (old) =>
        old?.map((b) => (b.id === buildId ? { ...b, title, godIds, ...(imageUrl ? { imageUrl } : {}) } : b)),
      )
    },
  })
}

/** Solo funciona si este dispositivo subió la build; lo valida api/delete-build.ts. */
export function useDeleteBuild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ buildId }: { buildId: string }) => {
      const res = await fetch('/api/delete-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId, ownerToken: getDeviceId() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'No se pudo borrar la build.')
      }
    },
    onSuccess: (_data, { buildId }) => {
      unmarkMine(buildId)
      qc.setQueryData<Build[]>(BUILDS_KEY, (old) => old?.filter((b) => b.id !== buildId))
    },
  })
}

interface ToggleReactionInput {
  buildId: string
  godId: string
  emoji: string
  voterId: string
  reacted: boolean
}

/**
 * Reacciones por CARD (build + dios), no por build entera: una foto con
 * varios dioses tiene varias cards, y reaccionar en una no debe aparecer en
 * las otras. Sin dueño: cualquiera puede poner/quitar la suya, es solo
 * diversión.
 */
export function useToggleReaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ buildId, godId, emoji, voterId, reacted }: ToggleReactionInput) => {
      if (reacted) {
        const { error } = await supabase
          .from('build_reactions')
          .delete()
          .eq('build_id', buildId)
          .eq('god_id', godId)
          .eq('voter_id', voterId)
          .eq('emoji', emoji)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('build_reactions')
          .insert({ build_id: buildId, god_id: godId, voter_id: voterId, emoji })
        if (error) throw error
      }
    },
    onMutate: async ({ buildId, godId, emoji, voterId, reacted }) => {
      await qc.cancelQueries({ queryKey: BUILDS_KEY })
      const previous = qc.getQueryData<Build[]>(BUILDS_KEY)
      qc.setQueryData<Build[]>(BUILDS_KEY, (old) =>
        old?.map((b) => {
          if (b.id !== buildId) return b
          const reactions: Reaction[] = reacted
            ? b.reactions.filter((r) => !(r.godId === godId && r.emoji === emoji && r.voterId === voterId))
            : [...b.reactions, { godId, emoji, voterId }]
          return { ...b, reactions }
        }),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(BUILDS_KEY, context.previous)
    },
  })
}
