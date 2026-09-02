import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/**
 * Borra una build, pero solo si el ownerToken que manda el navegador
 * coincide con el guardado en build_owners al crearla (ver
 * src/lib/deviceId.ts). Usa la service_role key porque build_owners no
 * tiene select público -- ni siquiera este chequeo se puede hacer con la
 * anon key del cliente.
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

  const { buildId, ownerToken } = (req.body ?? {}) as { buildId?: unknown; ownerToken?: unknown }
  if (typeof buildId !== 'string' || typeof ownerToken !== 'string' || !ownerToken) {
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

  const { error: deleteError } = await supabase.from('builds').delete().eq('id', buildId)
  if (deleteError) {
    res.status(500).json({ error: deleteError.message })
    return
  }

  res.status(200).json({ ok: true })
}
