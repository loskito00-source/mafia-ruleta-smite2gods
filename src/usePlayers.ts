import { useCallback, useMemo, useState } from 'react'
import type { Player } from './types'
import { DEFAULT_PLAYERS } from './lib'

const STORAGE_KEY = 'ruleta-custom-players'

function readStored(): Player[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (p): p is Player =>
          !!p &&
          typeof p.id === 'string' &&
          typeof p.name === 'string' &&
          typeof p.tag === 'string',
      )
      .map((p) => ({ id: p.id, name: p.name, tag: p.tag }))
  } catch {
    return []
  }
}

export function usePlayers() {
  const [custom, setCustom] = useState<Player[]>(readStored)
  const players = useMemo(() => [...DEFAULT_PLAYERS, ...custom], [custom])

  const addPlayer = useCallback((rawName: string): Player | null => {
    const name = rawName.trim()
    if (!name) return null
    const tag =
      name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 3) || name[0].toUpperCase()
    const player: Player = {
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      tag,
    }
    setCustom((prev) => {
      const next = [...prev, player]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    return player
  }, [])

  const removePlayer = useCallback((id: string) => {
    setCustom((prev) => {
      const next = prev.filter((p) => p.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { players, addPlayer, removePlayer }
}
