import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { pressable } from '../lib/motion'

const OPTIONS = [
  {
    to: '/ruleta',
    label: 'Ruleta',
    desc: 'Sortea equipos y dioses al azar para la partida.',
    accent: 'text-amber-300',
    ring: 'god-ring',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v9l6 3" />
      </svg>
    ),
  },
  {
    to: '/builds',
    label: 'Builds',
    desc: 'Guarda y busca las builds de cada dios por foto.',
    accent: 'text-amber-300',
    ring: 'god-ring',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
  },
] as const

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-4 py-10">
      <motion.header
        className="text-center"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14 }}
      >
        <h1 className="title-gradient title-shimmer font-display text-4xl font-black tracking-widest uppercase sm:text-5xl">
          Smite 2 — Gods
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/60 sm:text-base">
          ¿Qué quieres hacer?
        </p>
      </motion.header>

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
        {OPTIONS.map((opt, i) => (
          <motion.div
            key={opt.to}
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.15 + i * 0.1 }}
          >
            <Link to={opt.to} className="block">
              <motion.div
                whileHover={{ ...pressable.whileHover, y: -4 }}
                whileTap={pressable.whileTap}
                transition={pressable.transition}
                className="card-glass card-hover flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-white/10 px-6 py-10 text-center"
              >
                <span className={`grid h-16 w-16 place-items-center rounded-2xl bg-white/5 ${opt.ring} ${opt.accent}`}>
                  {opt.icon}
                </span>
                <p className={`font-display text-2xl font-black uppercase tracking-widest ${opt.accent}`}>
                  {opt.label}
                </p>
                <p className="text-sm text-white/55">{opt.desc}</p>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  )
}
