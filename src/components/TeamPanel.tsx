import { memo } from 'react'
import { motion } from 'framer-motion'
import type { Team } from '../types'
import { springBouncy, springGentle } from '../lib/motion'
import GodCard from './GodCard'

const ACCENT = {
  gold: {
    label: 'text-amber-300',
    border: 'border-amber-400/50',
    glow: '0 0 70px -18px rgba(245,197,66,0.6)',
    ring: 'god-ring',
    role: 'text-amber-300/80',
    gradient: 'from-amber-500/15 to-transparent',
  },
  ice: {
    label: 'text-teal-300',
    border: 'border-teal-300/50',
    glow: '0 0 70px -18px rgba(94,234,212,0.55)',
    ring: 'god-ring-blue',
    role: 'text-teal-300/80',
    gradient: 'from-teal-400/15 to-transparent',
  },
  red: {
    label: 'text-rose-300',
    border: 'border-rose-400/50',
    glow: '0 0 70px -18px rgba(255,59,92,0.55)',
    ring: 'god-ring-red',
    role: 'text-rose-300/80',
    gradient: 'from-rose-500/15 to-transparent',
  },
}

export default memo(function TeamPanel({
  team,
  index,
  onReroll,
  tick,
}: {
  team: Team
  index: number
  onReroll: (playerIndex: number) => void
  tick: (step: number) => void
}) {
  const a = ACCENT[team.accent]
  const side = index === 0 ? 'left' : 'right'

  return (
    <motion.section
      className={`card-glass relative w-full max-w-xl overflow-hidden rounded-3xl border p-5 sm:p-6 ${a.border}`}
      style={{ boxShadow: a.glow }}
      initial={{ opacity: 0, x: side === 'left' ? -220 : 220, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.15 + index * 0.25 }}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${a.gradient}`} />
      <motion.header
        className="relative mb-4 flex items-center justify-between"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 + index * 0.25 }}
      >
        <h2 className={`font-display text-2xl font-black uppercase tracking-wider sm:text-3xl ${a.label}`}>
          {team.name}
        </h2>
        <div className="flex gap-1.5">
          {team.players.map((_, i) => (
            <motion.span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${a.label}`}
              style={{ background: 'currentColor', boxShadow: a.glow }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...springBouncy, delay: 0.7 + index * 0.25 + i * 0.1 }}
            />
          ))}
        </div>
      </motion.header>

      <div className="relative flex flex-wrap justify-center gap-3 sm:gap-4">
        {team.players.map(({ player, god }, i) => (
          <div key={player.id} className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...springGentle, delay: 0.6 + index * 0.25 + i * 0.16 }}
            >
              <GodCard
                player={player}
                god={god}
                ringClass={a.ring}
                roleColor={a.role}
                nameColor={a.label}
                onReroll={() => onReroll(i)}
                tick={tick}
              />
            </motion.div>
          </div>
        ))}
      </div>
    </motion.section>
  )
})
