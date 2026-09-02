const KEY = 'smite2-device-id'

/**
 * Id anónimo estable por navegador/dispositivo (sin cuentas ni login).
 * Se usa como "voter_id" en reacciones y como dueño de una build para poder
 * editarla/borrarla solo desde donde se subió — ver supabase/schema.sql.
 */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    // Sin localStorage (modo privado estricto, etc.) no se puede persistir:
    // se genera uno de una sola vez, mejor que romper la función.
    return crypto.randomUUID()
  }
}
