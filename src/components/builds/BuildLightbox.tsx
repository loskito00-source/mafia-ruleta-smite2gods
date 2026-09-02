import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Build, God } from '../../types'
import { formatBuildDate, godImageById } from '../../lib'
import { fullUrl, thumbUrl } from '../../lib/cloudinary'
import { sectionExit } from '../../lib/motion'
import { useDeleteBuild, useUpdateBuild } from '../../lib/builds'
import { getMyBuildIds } from '../../lib/myBuilds'
import GodPicker from './GodPicker'
import PhotoPicker from './PhotoPicker'

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
  const [zoomed, setZoomed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editGodIds, setEditGodIds] = useState<string[]>([])
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editProgress, setEditProgress] = useState<number | null>(null)

  const updateBuild = useUpdateBuild()
  const deleteBuild = useDeleteBuild()

  const mine = build ? getMyBuildIds().has(build.id) : false

  useEffect(() => {
    setZoomed(false)
    setEditing(false)
    setConfirmingDelete(false)
    updateBuild.reset()
    deleteBuild.reset()
    setEditTitle(build?.title ?? '')
    setEditGodIds(build?.godIds ?? [])
    setEditFile(null)
    setEditProgress(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build?.id])

  const saveEdit = () => {
    if (!build || editGodIds.length === 0) return
    updateBuild.mutate(
      { buildId: build.id, title: editTitle, godIds: editGodIds, file: editFile, onProgress: setEditProgress },
      { onSuccess: () => setEditing(false) },
    )
  }

  const confirmDelete = () => {
    if (!build) return
    deleteBuild.mutate({ buildId: build.id }, { onSuccess: onClose })
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

          {editing ? (
            <div
              className="flex flex-1 items-center justify-center overflow-y-auto px-3 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card-glass flex w-full max-w-sm flex-col gap-3 rounded-2xl border-white/10 p-3.5">
                <PhotoPicker file={editFile} onChange={setEditFile} fallbackPreviewUrl={thumbUrl(build.imageUrl)} />
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={60}
                  placeholder="Título (opcional)"
                  className="w-full rounded-xl border border-white/15 bg-[#0b0e1c] px-3.5 py-2.5 text-sm font-semibold text-white placeholder-white/35 outline-none transition focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
                />
                <GodPicker
                  selected={editGodIds}
                  onToggle={(id) =>
                    setEditGodIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
                  }
                />
                {updateBuild.isError && (
                  <p className="text-xs font-semibold text-rose-300">{(updateBuild.error as Error).message}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 cursor-pointer rounded-full border border-white/15 py-2 text-xs font-black uppercase tracking-wide text-white/60 transition hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={editGodIds.length === 0 || updateBuild.isPending}
                    className="flex-1 cursor-pointer rounded-full bg-amber-400 py-2 text-xs font-black uppercase tracking-wide text-[#3a2a05] transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updateBuild.isPending
                      ? editProgress !== null && editProgress < 100
                        ? `Subiendo... ${editProgress}%`
                        : 'Guardando...'
                      : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                <div className="flex flex-wrap items-center justify-between gap-2">
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

                  {mine && (
                    <div className="flex gap-2">
                      {confirmingDelete ? (
                        <>
                          <span className="self-center text-xs font-bold text-rose-300">¿Borrar?</span>
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(false)}
                            className="cursor-pointer rounded-full border border-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white/60 transition hover:text-white"
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={confirmDelete}
                            disabled={deleteBuild.isPending}
                            className="cursor-pointer rounded-full bg-rose-500 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white transition disabled:opacity-60"
                          >
                            {deleteBuild.isPending ? 'Borrando...' : 'Sí, borrar'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="cursor-pointer rounded-full border border-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white/60 transition hover:text-white"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(true)}
                            className="cursor-pointer rounded-full border border-rose-400/30 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-rose-300 transition hover:bg-rose-400/10"
                          >
                            Borrar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {deleteBuild.isError && (
                  <p className="text-xs font-semibold text-rose-300">{(deleteBuild.error as Error).message}</p>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
