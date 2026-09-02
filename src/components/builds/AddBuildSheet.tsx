import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import GodPicker from './GodPicker'
import PhotoPicker from './PhotoPicker'
import { useCreateBuild } from '../../lib/builds'
import { trackGods } from '../../lib/trackGods'
import { pressable, sectionExit } from '../../lib/motion'

export default function AddBuildSheet({
  open,
  onClose,
  defaultGodId,
}: {
  open: boolean
  onClose: () => void
  defaultGodId?: string | null
}) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [godIds, setGodIds] = useState<string[]>([])
  const [progress, setProgress] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [tracking, setTracking] = useState(false)
  const create = useCreateBuild()

  useEffect(() => {
    if (open) {
      setFile(null)
      setTitle('')
      setGodIds(defaultGodId ? [defaultGodId] : [])
      setProgress(null)
      setNotice(null)
      setTracking(false)
      create.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultGodId])

  const toggleGod = useCallback((id: string) => {
    setGodIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }, [])

  const trackDioses = useCallback(async () => {
    if (!file || tracking) return
    setTracking(true)
    setNotice(null)
    try {
      const ids = await trackGods(file)
      if (ids.length === 0) {
        setNotice('No reconocí ningún dios en la foto. Selecciónalos a mano.')
      } else {
        setGodIds(ids)
        setNotice(
          `Reconocí ${ids.length} dios${ids.length === 1 ? '' : 'es'}. Revisa la selección antes de guardar.`,
        )
      }
    } catch (err) {
      setNotice((err as Error).message)
    } finally {
      setTracking(false)
    }
  }, [file, tracking])

  const canSubmit = Boolean(file) && godIds.length > 0 && !create.isPending

  const submit = useCallback(() => {
    if (!file || godIds.length === 0) return
    create.mutate(
      { file, godIds, title, onProgress: setProgress },
      { onSuccess: onClose },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, godIds, title])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: sectionExit }}
          onClick={onClose}
        >
          <motion.div
            className="card-glass relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border-white/10 sm:max-w-md sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0, transition: sectionExit }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="font-display text-lg font-black uppercase tracking-wide text-white">
                Nueva build
              </h2>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <PhotoPicker file={file} onChange={setFile} />

              <div className="mt-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={60}
                  placeholder="Título (opcional)"
                  className="w-full rounded-xl border border-white/15 bg-[#0b0e1c] px-3.5 py-2.5 text-sm font-semibold text-white placeholder-white/35 outline-none transition focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/50">
                    ¿De qué dioses es esta build?
                  </p>
                  {file && (
                    <motion.button
                      type="button"
                      onClick={trackDioses}
                      disabled={tracking}
                      whileHover={!tracking ? pressable.whileHover : undefined}
                      whileTap={!tracking ? pressable.whileTap : undefined}
                      transition={pressable.transition}
                      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-amber-300 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {tracking ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="animate-spin"
                        >
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
                          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 12 2 2 4-4" />
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      )}
                      {tracking ? 'Reconociendo...' : 'Reconocer dioses'}
                    </motion.button>
                  )}
                </div>
                {notice && (
                  <p className="mb-2 text-xs font-semibold text-amber-300/90">{notice}</p>
                )}
                <GodPicker selected={godIds} onToggle={toggleGod} />
              </div>

              {create.isError && (
                <p className="mt-3 text-xs font-semibold text-rose-300">
                  {(create.error as Error).message}
                </p>
              )}
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              <motion.button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                whileHover={canSubmit ? pressable.whileHover : undefined}
                whileTap={canSubmit ? pressable.whileTap : undefined}
                transition={pressable.transition}
                className={`relative w-full cursor-pointer overflow-hidden rounded-full py-3 text-center font-display text-sm font-black uppercase tracking-widest transition ${
                  canSubmit
                    ? 'btn-sortear text-[#3a2a05]'
                    : 'cursor-not-allowed bg-[#22243a] text-white/30'
                }`}
              >
                {create.isPending
                  ? progress !== null && progress < 100
                    ? `Subiendo... ${progress}%`
                    : 'Guardando...'
                  : 'Guardar build'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
