const KEY = 'smite2-my-builds'

/**
 * Qué builds subió ESTE navegador (para mostrar "Editar"/"Borrar" solo ahí).
 * El backend igual revalida el dueño real contra build_owners antes de
 * tocar nada (ver api/delete-build.ts, api/update-build.ts): esto es solo
 * para decidir qué botones mostrar, no la fuente de verdad.
 */
export function getMyBuildIds(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function markAsMine(buildId: string) {
  try {
    const ids = getMyBuildIds()
    ids.add(buildId)
    localStorage.setItem(KEY, JSON.stringify([...ids]))
  } catch {
    // Sin localStorage no se puede recordar "es mía"; no rompe nada más.
  }
}

export function unmarkMine(buildId: string) {
  try {
    const ids = getMyBuildIds()
    ids.delete(buildId)
    localStorage.setItem(KEY, JSON.stringify([...ids]))
  } catch {
    // ver arriba
  }
}
