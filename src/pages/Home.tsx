import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { GODS, godImageById } from '../lib'
import { pressable } from '../lib/motion'

const ACCENT = {
  gold: {
    label: 'text-amber-300',
    hoverBorder: 'hover:border-amber-400/50',
    ring: 'god-ring',
    hoverGlow: 'hover:shadow-[0_28px_70px_-26px_rgba(245,197,66,0.5)]',
  },
  ice: {
    label: 'text-teal-300',
    hoverBorder: 'hover:border-teal-300/50',
    ring: 'god-ring-blue',
    hoverGlow: 'hover:shadow-[0_28px_70px_-26px_rgba(94,234,212,0.45)]',
  },
} as const

const OPTIONS = [
  {
    to: '/ruleta',
    label: 'Ruleta',
    desc: 'Sortea equipos y dioses al azar para la partida.',
    accent: 'gold' as const,
    gods: ['Zeus', 'Loki', 'Kali'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v9l6 3" />
      </svg>
    ),
  },
  {
    to: '/builds',
    label: 'Builds',
    desc: 'Guarda y busca las builds de cada dios por foto.',
    accent: 'ice' as const,
    gods: ['Odin', 'Athena', 'Ra'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
  },
] as const

const ROSTER_IDS = ['Zeus', 'Odin', 'Kali', 'Anubis', 'Thor', 'Loki', 'Athena', 'Poseidon', 'Amaterasu', 'Sobek']
const MARQUEE_IDS = [...ROSTER_IDS, ...ROSTER_IDS]
const PANTHEON_COUNT = new Set(GODS.map((g) => g.pantheon).filter(Boolean)).size

/**
 * Al entrar a /builds, el chunk (framer-motion + supabase-js) tiene que
 * bajar y ejecutarse ANTES de que arranque el fetch a Supabase — eso es
 * lo que se siente como "tarda en cargar". Adelantar ambos (chunk + query)
 * en cuanto hay intención de ir a builds (hover/touch/foco) hace que casi
 * siempre ya estén listos cuando la ruta realmente cambia.
 */
function usePreloadBuilds() {
  const qc = useQueryClient()
  return () => {
    import('./BuildsPage')
    import('../lib/builds').then(({ BUILDS_KEY, fetchBuilds }) =>
      qc.prefetchQuery({ queryKey: BUILDS_KEY, queryFn: fetchBuilds, staleTime: 60_000 }),
    )
  }
}

function RosterMarquee() {
  return (
    <div className="w-full overflow-hidden">
      <div className="roster-track flex w-max gap-3">
        {MARQUEE_IDS.map((id, i) => (
          <img
            key={`${id}-${i}`}
            src={godImageById(id)}
            alt=""
            loading="lazy"
            decoding="async"
            width={56}
            height={56}
            className="h-11 w-11 shrink-0 rounded-full object-cover opacity-75 sm:h-14 sm:w-14"
          />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const preloadBuilds = usePreloadBuilds()
  return (
    <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 overflow-hidden px-4 py-10">
      <motion.header
        className="text-center"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14 }}
      >
        <h1 className="font-hero title-gradient title-shimmer text-4xl font-black tracking-widest uppercase sm:text-6xl">
          Smite 2 — Gods
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/60 sm:text-base">
          Sortea la partida o guarda las builds de tu grupo.
        </p>
        <p className="mt-1 text-xs font-semibold tracking-wide text-white/30">
          {GODS.length} dioses · {PANTHEON_COUNT} panteones
        </p>
      </motion.header>

      <motion.div
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.35 }}
      >
        <RosterMarquee />
      </motion.div>

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
        {OPTIONS.map((opt, i) => {
          const a = ACCENT[opt.accent]
          return (
            <motion.div
              key={opt.to}
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.15 + i * 0.1 }}
            >
              <Link
                to={opt.to}
                className="block"
                {...(opt.to === '/builds'
                  ? { onMouseEnter: preloadBuilds, onTouchStart: preloadBuilds, onFocus: preloadBuilds }
                  : {})}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -6 }}
                  whileTap={pressable.whileTap}
                  transition={pressable.transition}
                  className={`card-glass relative h-64 w-full cursor-pointer overflow-hidden rounded-3xl border border-white/10 transition-shadow sm:h-72 ${a.hoverBorder} ${a.hoverGlow}`}
                >
                  <img
                    src={godImageById(opt.gods[0])}
                    alt=""
                    className="absolute left-[6%] top-[9%] h-20 w-20 -rotate-6 rounded-2xl object-cover opacity-85 shadow-xl ring-1 ring-white/10 sm:h-24 sm:w-24"
                  />
                  <img
                    src={godImageById(opt.gods[2])}
                    alt=""
                    className="absolute right-[6%] top-[9%] h-20 w-20 rotate-6 rounded-2xl object-cover opacity-85 shadow-xl ring-1 ring-white/10 sm:h-24 sm:w-24"
                  />
                  <img
                    src={godImageById(opt.gods[1])}
                    alt=""
                    className={`absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 rounded-2xl object-cover shadow-2xl sm:h-28 sm:w-28 ${a.ring}`}
                  />

                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#05050a] via-[#05050a]/85 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-left">
                    <div className={`flex items-center gap-2 ${a.label}`}>
                      {opt.icon}
                      <p className="font-display text-xl font-black uppercase tracking-widest sm:text-2xl">
                        {opt.label}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-white/55">{opt.desc}</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </main>
  )
}
