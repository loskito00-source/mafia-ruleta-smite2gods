import { useEffect, useRef, useState } from 'react'

const HIGHLIGHT_MS = 2600

/**
 * Marca como "recientes" los ids que aparecen en `ids` después de que la
 * lista ya estaba lista una primera vez (ignora la carga inicial, para no
 * animar todo el grid al entrar a la página). Sirve para resaltar builds
 * que acaban de llegar, ya sea por el propio insert o por otra persona via
 * realtime — a los efectos de la animación da igual el origen.
 */
export function useRecentIds(ids: string[], ready: boolean): ReadonlySet<string> {
  const [recent, setRecent] = useState<ReadonlySet<string>>(() => new Set())
  const prevRef = useRef<Set<string> | null>(null)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    if (!ready) return
    if (prevRef.current === null) {
      prevRef.current = new Set(ids)
      return
    }
    const prev = prevRef.current
    const fresh = ids.filter((id) => !prev.has(id))
    prevRef.current = new Set(ids)
    if (fresh.length === 0) return

    setRecent((old) => {
      const next = new Set(old)
      for (const id of fresh) next.add(id)
      return next
    })
    for (const id of fresh) {
      const timer = setTimeout(() => {
        timers.current.delete(id)
        setRecent((old) => {
          if (!old.has(id)) return old
          const next = new Set(old)
          next.delete(id)
          return next
        })
      }, HIGHLIGHT_MS)
      timers.current.set(id, timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, ready])

  useEffect(() => {
    const timersMap = timers.current
    return () => timersMap.forEach(clearTimeout)
  }, [])

  return recent
}
