import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { God, Player } from '../types'
import { GODS, godImage, pantheonName, ROLE_LABELS } from '../lib'
import { pressable, springGentle } from '../lib/motion'

const REROLL_REEL_LENGTH = 12
const REEL_EASE = [0.12, 0.8, 0.15, 1] as const

function buildReel(finalGod: God): God[] {
  const reel: God[] = []
  let last = ''
  for (let i = 0; i < REROLL_REEL_LENGTH - 1; i++) {
    let pick: God
    do {
      pick = GODS[Math.floor(Math.random() * GODS.length)]
    } while (pick.id === last || pick.id === finalGod.id)
    reel.push(pick)
    last = pick.id
  }
  reel.push(finalGod)
  return reel
}

function RefreshIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

export default function GodCard({
  player,
  god,
  ringClass,
  roleColor,
  nameColor,
  onReroll,
  tick,
}: {
  player: Player
  god: God
  ringClass: string
  roleColor: string
  nameColor: string
  onReroll: () => void
  tick: (step: number) => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const [displayGod, setDisplayGod] = useState(god)
  const [reel, setReel] = useState<God[] | null>(null)
  const spinning = reel !== null
  const prevGodRef = useRef(god.id)
  const windowRef = useRef<HTMLDivElement>(null)
  const lastTickIndex = useRef(0)

  useEffect(() => {
    if (prevGodRef.current === god.id) return
    prevGodRef.current = god.id
    setDisplayGod(god)
    if (shouldReduceMotion) return
    lastTickIndex.current = 0
    setReel(buildReel(god))
  }, [god, shouldReduceMotion])

  const itemSize = windowRef.current?.offsetHeight ?? 0
  const distance = reel ? itemSize * (reel.length - 1) : 0
  const showReel = reel !== null && itemSize > 0

  return (
    <motion.div
      className="card-glass relative flex w-32 flex-col items-center overflow-hidden rounded-2xl border-white/10 pb-3 sm:w-36"
      initial={{ opacity: 0, y: 40, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springGentle}
      whileHover={{ y: -6 }}
    >
      <div className="mb-2 w-full border-b border-white/10 bg-black/25 px-2 py-1.5">
        <p className={`truncate text-center font-display text-sm font-black uppercase tracking-wide ${nameColor}`}>
          {player.name}
        </p>
      </div>

      <div className="flex flex-col items-center gap-1.5 px-2">
        <div
          ref={windowRef}
          className={`relative h-24 w-24 overflow-hidden rounded-2xl sm:h-28 sm:w-28 ${ringClass}`}
          style={{
            maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
          }}
        >
          {showReel && reel ? (
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: -distance }}
              transition={{ duration: 0.9, ease: REEL_EASE }}
              onUpdate={(latest) => {
                const y = typeof latest.y === 'number' ? latest.y : 0
                const idx = Math.min(reel.length - 1, Math.floor(-y / itemSize))
                if (idx !== lastTickIndex.current) {
                  lastTickIndex.current = idx
                  tick(idx)
                }
              }}
              onAnimationComplete={() => setReel(null)}
            >
              {reel.map((g, i) => (
                <img
                  key={`${g.id}-${i}`}
                  src={godImage(g)}
                  alt={g.name}
                  className="h-24 w-24 object-cover sm:h-28 sm:w-28"
                />
              ))}
            </motion.div>
          ) : (
            <img
              src={godImage(displayGod)}
              alt={displayGod.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </div>

        <div className="flex flex-col items-center">
          <p className="max-w-full truncate text-sm font-bold leading-tight text-white sm:text-base">
            {displayGod.name}
          </p>
          <p className="text-xs leading-tight text-white/55">{pantheonName(displayGod.pantheon)}</p>
          {displayGod.roles.length > 0 && (
            <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wider ${roleColor}`}>
              {displayGod.roles.map((r) => ROLE_LABELS[r] ?? r).join(' · ')}
            </p>
          )}
        </div>

        <motion.button
          onClick={onReroll}
          disabled={spinning}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide transition ${
            spinning
              ? 'border-white/10 text-white/30'
              : 'border-amber-400/40 text-amber-300 hover:bg-amber-400/10 hover:shadow-[0_0_18px_-4px_rgba(245,197,66,0.7)]'
          }`}
          whileHover={spinning ? undefined : pressable.whileHover}
          whileTap={spinning ? undefined : pressable.whileTap}
          transition={pressable.transition}
        >
          <RefreshIcon />
          {spinning ? 'Sorteando' : 'Rever dios'}
        </motion.button>
      </div>
    </motion.div>
  )
}
