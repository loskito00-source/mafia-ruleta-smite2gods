import type { God, Player } from './types'
import godsData from './data/gods.json'

export const GODS: God[] = (godsData as God[]).sort((a, b) =>
  a.name.localeCompare(b.name),
)

export const DEFAULT_PLAYERS: Player[] = [
  { id: 'texas', name: 'Texas', tag: 'TX' },
  { id: 'kevzx', name: 'Kevzx', tag: 'KZ' },
  { id: 'losko', name: 'Losko', tag: 'LO' },
  { id: 'asunto', name: 'Asunto', tag: 'AS' },
  { id: 'sam', name: 'Sam', tag: 'SM' },
  { id: 'milo', name: 'Milo', tag: 'MI' },
  { id: 'luigy', name: 'Luigy', tag: 'LG' },
]

export const godImage = (god: God) => `/images/${god.id}.webp`
export const godImageById = (id: string) => `/images/${id}.webp`

export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickRandom<T>(arr: T[], n: number, exclude: Set<number> = new Set()): T[] {
  const pool = arr.filter((_, i) => !exclude.has(i))
  return shuffled(pool).slice(0, n)
}

export const PANTHEONS: Record<string, string> = {
  greek: 'Griego',
  hindu: 'Hindú',
  maya: 'Maya',
  tales: 'Tales of Arabia',
  japanese: 'Japonés',
  egyptian: 'Egipcio',
  celtic: 'Celta',
  roman: 'Romano',
  voodoo: 'Vudú',
  chinese: 'Chino',
  norse: 'Nórdico',
  babylonian: 'Babilónico',
  arthurian: 'Artúrico',
  polynesian: 'Polinesio',
  korean: 'Coreano',
  yoruba: 'Yoruba',
}

export const ROLE_LABELS: Record<string, string> = {
  esolo: 'Solo',
  emiddle: 'Mid',
  ejungle: 'Jungla',
  ecarry: 'Carry',
  esupport: 'Soporte',
}

export const pantheonName = (p: string | null) => (p ? PANTHEONS[p] ?? p : '—')

/** minúsculas + sin acentos, para búsquedas que ignoren tildes. */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const shortDate = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatBuildDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return 'Hoy'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer'
  return shortDate.format(date)
}
