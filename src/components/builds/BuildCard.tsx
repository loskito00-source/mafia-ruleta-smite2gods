import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatBuildDate, godImageById } from '../../lib'

export default memo(function BuildCard({
  build,
  primaryGod,
  extraCount,
  isNew = false,
  onOpen,
}: {
  build: { title: string | null; createdAt: string }
  primaryGod: { id: string; name: string }
  extraCount: number
  isNew?: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`card-glass card-hover group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border-white/10 text-left transition active:scale-[0.98] ${
        isNew ? 'build-card-new' : ''
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black/30">
        <img
          src={godImageById(primaryGod.id)}
          alt={primaryGod.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
        />
        {extraCount > 0 && (
          <span className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/70 px-2 py-0.5 text-[10px] font-black text-amber-300">
            +{extraCount}
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
      <div className="flex flex-1 flex-col gap-0.5 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-display text-sm font-black uppercase tracking-wide text-white">
            {primaryGod.name}
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
  )
})
