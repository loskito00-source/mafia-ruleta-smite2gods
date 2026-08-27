import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
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

async function fetchBuilds(): Promise<Build[]> {
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
