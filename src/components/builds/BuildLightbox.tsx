import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Build, God } from '../../types'
import { formatBuildDate, godImageById } from '../../lib'
import { fullUrl } from '../../lib/cloudinary'
import { useDeleteBuild } from '../../lib/builds'
import { sectionExit } from '../../lib/motion'

export default function BuildLightbox({
  build,
  gods,
  onClose,
  onSelectGod,
}: {
  build: Build | null
  gods: God[]
  onClose: () => void
  onSelectGod: (godId: string) => void
}) {
  const del = useDeleteBuild()
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    setZoomed(false)
  }, [build])

  const handleDelete = () => {
    if (!build) return
    if (!window.confirm('¿Borrar esta build? No se puede deshacer.')) return
    del.mutate(build.id, { onSuccess: onClose })
  }

  return (
    <AnimatePresence>
      {build && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col bg-black/92"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: sectionExit }}
          onClick={onClose}
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-black uppercase tracking-wide text-white/80">
                {build.title || 'Build'}
              </p>
              <p className="text-xs font-semibold text-white/40">{formatBuildDate(build.createdAt)}</p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div
            className={`flex flex-1 px-2 ${zoomed ? 'overflow-auto' : 'items-center justify-center overflow-hidden'}`}
          >
            <motion.img
              src={fullUrl(build.imageUrl)}
              alt={build.title ?? 'Build'}
              onClick={(e) => {
                e.stopPropagation()
                setZoomed((z) => !z)
              }}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className={
                zoomed
                  ? 'my-auto w-[200%] max-w-none cursor-zoom-out rounded-xl object-contain sm:w-[160%]'
                  : 'max-h-[68vh] max-w-full cursor-zoom-in rounded-xl object-contain'
              }
            />
          </div>
          <p className="pb-1 text-center text-[11px] font-semibold text-white/35">
            Toca la foto para hacer zoom
          </p>

          <div
            className="card-glass mx-3 mb-3 flex flex-col gap-3 rounded-2xl border-white/10 p-3.5 sm:mx-6 sm:mb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap gap-2">
              {gods.map((g) => (
                <button
                  key={g.id}
                  onClick={() => onSelectGod(g.id)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 transition hover:border-amber-400/50"
                >
                  <img src={godImageById(g.id)} alt="" className="h-6 w-6 rounded-full object-cover" />
                  <span className="text-xs font-bold text-white/85">{g.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleDelete}
              disabled={del.isPending}
              className="cursor-pointer self-start text-xs font-bold uppercase tracking-wide text-rose-300/80 transition hover:text-rose-300 disabled:opacity-40"
            >
              {del.isPending ? 'Borrando...' : 'Borrar build'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
