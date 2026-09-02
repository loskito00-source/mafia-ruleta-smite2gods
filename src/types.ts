export interface God {
  id: string
  name: string
  portrait: string
  pantheon: string | null
  roles: string[]
  aspects: string[]
  released: boolean
  portrait_local: string | null
}

export interface Player {
  id: string
  name: string
  tag: string
}

export interface Team {
  name: string
  accent: 'gold' | 'ice' | 'red'
  players: { player: Player; god: God }[]
}

export type Phase = 'lobby' | 'spinning' | 'result'

export interface Reaction {
  godId: string
  emoji: string
  voterId: string
}

export interface Build {
  id: string
  imageUrl: string
  title: string | null
  createdAt: string
  godIds: string[]
  reactions: Reaction[]
}
