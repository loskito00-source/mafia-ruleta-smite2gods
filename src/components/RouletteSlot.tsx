import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { God, Player } from '../types'
import { GODS, godImage } from '../lib'
import { springGentle } from '../lib/motion'

const REEL_LENGTH = 18
const REEL_EASE = [0.12, 0.8, 0.15, 1] as const

function buildReel(finalGod: God): God[] {
  const reel: God[] = []
  let last = ''
  for (let i = 0; i < REEL_LENGTH - 1; i++) {
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

export default memo(function RouletteSlot({
  player,
  finalGod,
  delay = 0,
  spinDuration = 2600,
  onDone,
  tick,
}: {
  player: Player
  finalGod: God
  delay?: number
  spinDuration?: number
  onDone: () => void
  tick: (step: number) => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const reel = useMemo(() => buildReel(finalGod), [finalGod])
  const windowRef = useRef<HTMLDivElement>(null)
  const [itemSize, setItemSize] = useState(0)
  const [settled, setSettled] = useState(false)
  const done = useRef(false)
  const lastTickIndex = useRef(0)

  useLayoutEffect(() => {
    const measure = () => {
      if (windowRef.current) setItemSize(windowRef.current.offsetHeight)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const finish = () => {
    if (done.current) return
    done.current = true
    setSettled(true)
    setTimeout(onDone, 260)
  }

  useEffect(() => {
    if (!shouldReduceMotion) return
    const t = setTimeout(finish, delay * 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const distance = itemSize * (reel.length - 1)
  const showReel = !shouldReduceMotion && itemSize > 0

  return (
    <motion.div
      className="card-glass relative flex w-36 flex-col items-center gap-1.5 rounded-2xl p-3"
      initial={{ opacity: 0, y: 60, scale: 0.8, rotateY: 90 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
      transition={{ ...springGentle, delay }}
    >
      <p className="text-sm font-bold uppercase tracking-wide text-white/90">
        {player.name}
      </p>

      <div
        ref={windowRef}
        className="god-ring relative h-24 w-24 overflow-hidden rounded-2xl sm:h-28 sm:w-28"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
        }}
      >
        {showReel ? (
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: -distance }}
            transition={{ duration: spinDuration / 1000, delay, ease: REEL_EASE }}
            onUpdate={(latest) => {
              const y = typeof latest.y === 'number' ? latest.y : 0
              const idx = Math.min(reel.length - 1, Math.floor(-y / itemSize))
              if (idx !== lastTickIndex.current) {
                lastTickIndex.current = idx
                tick(idx)
              }
            }}
            onAnimationComplete={finish}
          >
            {reel.map((g, i) => (
              <img
                key={`${g.id}-${i}`}
                src={godImage(g)}
                alt={g.name}
                width={256}
                height={256}
                decoding="async"
                className="h-24 w-24 object-cover sm:h-28 sm:w-28"
              />
            ))}
          </motion.div>
        ) : (
          <img
            src={godImage(finalGod)}
            alt={finalGod.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <motion.p
        className="w-full truncate text-center text-sm font-bold text-amber-100/90 sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: settled ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      >
        {finalGod.name}
      </motion.p>
    </motion.div>
  )
})
