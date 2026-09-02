import { memo, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatBuildDate, godImageById } from '../../lib'
import { getDeviceId } from '../../lib/deviceId'
import type { Reaction } from '../../types'

export default memo(function BuildCard({
  build,
  god,
  totalGods,
  isNew = false,
  onOpen,
  onReact,
  onOpenPicker,
}: {
  build: { title: string | null; createdAt: string; reactions: Reaction[] }
  god: { id: string; name: string }
  totalGods: number
  isNew?: boolean
  onOpen: () => void
  onReact: (emoji: string, reacted: boolean) => void
  onOpenPicker: () => void
}) {
  const deviceId = useMemo(() => getDeviceId(), [])

  // Las reacciones son por esta card puntual (build + dios), no por toda la
  // build: si la foto tiene varios dioses, cada uno lleva las suyas.
  const reactionEntries = useMemo(() => {
    const map = new Map<string, { count: number; reacted: boolean }>()
    for (const r of build.reactions) {
      if (r.godId !== god.id) continue
      const entry = map.get(r.emoji) ?? { count: 0, reacted: false }
      entry.count += 1
      if (r.voterId === deviceId) entry.reacted = true
      map.set(r.emoji, entry)
    }
    return [...map.entries()].map(([emoji, v]) => ({ emoji, ...v }))
  }, [build.reactions, god.id, deviceId])

  return (
    <div
      className={`card-glass card-hover group flex h-full w-full flex-col overflow-hidden rounded-2xl border-white/10 transition ${
        isNew ? 'build-card-new' : ''
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 cursor-pointer flex-col text-left active:scale-[0.98]"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-black/30">
          <img
            src={godImageById(god.id)}
            alt={god.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
          />
          {totalGods > 1 && (
            <span
              title={`Esta build tiene ${totalGods} dioses`}
              className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-2 py-0.5 text-[10px] font-black text-amber-300"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {totalGods}
            </span>
          )}
          <AnimatePresence>
            {isNew && (
              <motion.span
                initial={{ opacity: 0, y: -6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.35 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#3a2a05] shadow-[0_4px_16px_-4px_rgba(245,197,66,0.8)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#3a2a05]/70" />
                Nueva
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-0.5 px-3 pb-1.5 pt-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-display text-sm font-black uppercase tracking-wide text-white">
              {god.name}
            </p>
            <span className="shrink-0 text-[10px] font-semibold text-white/40">
              {formatBuildDate(build.createdAt)}
            </span>
          </div>
          {build.title && (
            <p className="truncate text-xs font-semibold text-white/55">{build.title}</p>
          )}
        </div>
      </button>

      <div className="flex flex-wrap items-center gap-1 px-3 pb-2.5">
        {reactionEntries.map(({ emoji, count, reacted }) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji, reacted)}
            className={`flex cursor-pointer items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] font-bold transition active:scale-90 ${
              reacted
                ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25'
            }`}
          >
            <span>{emoji}</span>
            <span>{count}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenPicker}
          title="Agregar reacción"
          className="grid h-5 w-5 cursor-pointer place-items-center rounded-full border border-white/10 bg-white/5 text-[11px] font-black leading-none text-white/50 transition hover:border-white/25 hover:text-white active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  )
})
