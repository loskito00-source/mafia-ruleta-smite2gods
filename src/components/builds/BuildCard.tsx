import { memo } from 'react'
import { formatBuildDate, godImageById } from '../../lib'

export default memo(function BuildCard({
  build,
  primaryGod,
  extraCount,
  onOpen,
}: {
  build: { title: string | null; createdAt: string }
  primaryGod: { id: string; name: string }
  extraCount: number
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-glass card-hover group flex cursor-pointer flex-col overflow-hidden rounded-2xl border-white/10 text-left transition active:scale-[0.98]"
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
