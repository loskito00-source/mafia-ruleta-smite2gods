import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/**
 * Edita el título, los dioses y (opcional) la foto de una build, pero solo
 * si el ownerToken que manda el navegador coincide con el guardado en
 * build_owners al crearla (ver src/lib/deviceId.ts). La foto ya se sube a
 * Cloudinary desde el cliente (ver useUpdateBuild); acá solo se guarda la
 * nueva URL. La foto vieja queda huérfana en Cloudinary (no se borra).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }

  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    res.status(500).json({ error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.' })
    return
  }

  const { buildId, ownerToken, title, godIds, imageUrl, imagePublicId } = (req.body ?? {}) as {
    buildId?: unknown
    ownerToken?: unknown
    title?: unknown
    godIds?: unknown
    imageUrl?: unknown
    imagePublicId?: unknown
  }

  if (
    typeof buildId !== 'string' ||
    typeof ownerToken !== 'string' ||
    !ownerToken ||
    !Array.isArray(godIds) ||
    godIds.length === 0 ||
    !godIds.every((g): g is string => typeof g === 'string') ||
    (title !== undefined && title !== null && typeof title !== 'string') ||
    (imageUrl !== undefined && typeof imageUrl !== 'string') ||
    (imagePublicId !== undefined && typeof imagePublicId !== 'string') ||
    // Si viene una, debe venir la otra: son del mismo upload a Cloudinary.
    Boolean(imageUrl) !== Boolean(imagePublicId)
  ) {
    res.status(400).json({ error: 'Datos inválidos.' })
    return
  }

  const supabase = createClient(url, serviceKey)

  const { data: owner, error: fetchError } = await supabase
    .from('build_owners')
    .select('owner_token')
    .eq('build_id', buildId)
    .maybeSingle()

  if (fetchError) {
    res.status(500).json({ error: fetchError.message })
    return
  }
  if (!owner || owner.owner_token !== ownerToken) {
    res.status(403).json({ error: 'Esta build no la subiste desde este dispositivo.' })
    return
  }

  const updatePayload: { title: string | null; image_url?: string; image_public_id?: string } = {
    title: (title as string | null | undefined)?.trim() || null,
  }
  if (typeof imageUrl === 'string' && typeof imagePublicId === 'string') {
    updatePayload.image_url = imageUrl
    updatePayload.image_public_id = imagePublicId
  }

  const { error: titleError } = await supabase.from('builds').update(updatePayload).eq('id', buildId)
  if (titleError) {
    res.status(500).json({ error: titleError.message })
    return
  }

  const { error: deleteGodsError } = await supabase.from('build_gods').delete().eq('build_id', buildId)
  if (deleteGodsError) {
    res.status(500).json({ error: deleteGodsError.message })
    return
  }

  const rows = godIds.map((god_id) => ({ build_id: buildId, god_id }))
  const { error: insertGodsError } = await supabase.from('build_gods').insert(rows)
  if (insertGodsError) {
    res.status(500).json({ error: insertGodsError.message })
    return
  }

  res.status(200).json({ ok: true })
}
