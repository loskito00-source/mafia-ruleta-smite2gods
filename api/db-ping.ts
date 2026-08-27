import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

/**
 * Hace una lectura mínima a Supabase para mantener el proyecto activo
 * (los proyectos free se pausan tras un tiempo sin actividad).
 * Pensado para ser golpeado por un cronjob externo cada ~10 min.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    res.status(500).json({ ok: false, error: 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY' })
    return
  }

  const supabase = createClient(url, anonKey)
  const { error } = await supabase.from('builds').select('id').limit(1)

  if (error) {
    res.status(500).json({ ok: false, error: error.message })
    return
  }

  res.status(200).json({ ok: true, timestamp: new Date().toISOString() })
}
