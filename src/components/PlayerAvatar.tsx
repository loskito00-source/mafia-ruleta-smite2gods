import { motion, useReducedMotion } from 'framer-motion'
import type { Player } from '../types'

const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'

export default function PlayerAvatar({
  player,
  size = 56,
  floatDelay = 0,
}: {
  player: Player
  size?: number
  floatDelay?: number
}) {
  const shouldReduceMotion = useReducedMotion()
  const frame = Math.max(2, Math.round(size * 0.07))

  return (
    <motion.div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      animate={shouldReduceMotion ? undefined : { y: [0, -3, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: floatDelay }}
    >
      {/* outer frame — dark steel bezel, no per-player hue */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: HEX_CLIP,
          background: 'linear-gradient(155deg, #454b6e, #262a45 50%, #14162a)',
          boxShadow: '0 6px 14px -8px rgba(0,0,0,0.8)',
        }}
      />
      {/* inner face — sunken so the monogram reads as engraved */}
      <div
        className="absolute grid place-items-center"
        style={{
          inset: frame,
          clipPath: HEX_CLIP,
          background: 'radial-gradient(circle at 35% 25%, #1c1f38, #0a0b16 85%)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7)',
        }}
      >
        <span
          className="font-display font-black text-amber-300/90"
          style={{
            fontSize: size * 0.32,
            textShadow: '0 0 8px rgba(245,197,66,0.4), 0 1px 0 rgba(0,0,0,0.5)',
            letterSpacing: '0.02em',
          }}
        >
          {player.tag}
        </span>
      </div>
    </motion.div>
  )
}
