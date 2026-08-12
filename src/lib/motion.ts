import type { Transition, Variants } from 'framer-motion'

// Shared easing curves (see animate skill reference: easing-and-timing.md)
export const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const
export const EASE_OUT_CUBIC = [0.33, 1, 0.68, 1] as const
export const EASE_IN_OUT_CUBIC = [0.645, 0.045, 0.355, 1] as const

// Spring presets — pick by element weight/purpose, not per-callsite tuning.
export const springSnappy: Transition = { type: 'spring', stiffness: 420, damping: 32 }
export const springGentle: Transition = { type: 'spring', stiffness: 220, damping: 22 }
export const springBouncy: Transition = { type: 'spring', stiffness: 300, damping: 15 }

// Enter/exit pair for phase-level sections. Exit runs faster than enter
// (~65% of the duration) so leaving never feels sluggish.
export const sectionEnter: Transition = { duration: 0.32, ease: EASE_OUT_CUBIC }
export const sectionExit: Transition = { duration: 0.2, ease: EASE_IN_OUT_CUBIC }

// Standard press feedback for interactive motion.button/motion.div elements.
export const pressable = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: springSnappy,
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: springGentle },
}

/** Stagger helper for a parent using `initial="hidden" animate="visible"`. */
export function staggerContainer(staggerChildren = 0.06, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren, delayChildren } },
  }
}
