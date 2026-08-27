import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import GodPicker from './GodPicker'
import { useCreateBuild } from '../../lib/builds'
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [godIds, setGodIds] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pasting, setPasting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const create = useCreateBuild()

  useEffect(() => {
    if (open) {
      setFile(null)
      setPreviewUrl(null)
      setTitle('')
      setGodIds(defaultGodId ? [defaultGodId] : [])
      setProgress(null)
      setNotice(null)
      create.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultGodId])

  const pickFile = useCallback((f: File | null) => {
    if (!f || !f.type.startsWith('image/')) {
      if (f) setNotice('Eso no parece una imagen. Prueba con otro archivo.')
      return
    }
    setNotice(null)
    setFile(f)
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(f)
    })
  }, [])

  const extractFileFromDataTransfer = (dt: DataTransfer): File | null => {
    if (dt.files && dt.files.length > 0) return dt.files[0]
    if (dt.items) {
      for (const item of dt.items) {
        if (item.kind === 'file') {
          const f = item.getAsFile()
          if (f) return f
        }
      }
    }
    return null
  }

  // Pegar directo (Ctrl+V) mientras la hoja está abierta, sin necesitar
  // que el foco esté en un input especifico.
  useEffect(() => {
    if (!open) return
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const f = item.getAsFile()
          if (f) {
            e.preventDefault()
            pickFile(f)
            return
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [open, pickFile])

  const pasteFromClipboard = useCallback(async () => {
    setNotice(null)
    if (!navigator.clipboard?.read) {
      setNotice('Tu navegador no deja leer el portapapeles con este botón: usa Ctrl+V sobre el recuadro, o arrastra el archivo.')
      return
    }
    setPasting(true)
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const ext = imageType.split('/')[1] || 'png'
          pickFile(new File([blob], `captura.${ext}`, { type: imageType }))
          return
        }
      }
      setNotice('No hay ninguna imagen copiada en el portapapeles. Toma la captura y vuelve a intentar.')
    } catch {
      setNotice('No se pudo leer el portapapeles. Usa Ctrl+V sobre el recuadro, o arrastra el archivo.')
    } finally {
      setPasting(false)
    }
  }, [pickFile])

  const toggleGod = useCallback((id: string) => {
    setGodIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }, [])

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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const picked = extractFileFromDataTransfer(e.dataTransfer)
                  if (picked) pickFile(picked)
                  else
                    setNotice(
                      'No se pudo leer esa imagen arrastrada. Cópiala (Ctrl+C) y usa "Pegar última captura", o elige el archivo.',
                    )
                }}
                className={`flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed transition ${
                  dragOver ? 'border-amber-400/70 bg-amber-400/5' : 'border-white/15 bg-black/20'
                }`}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-white/40">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                    <p className="text-xs font-semibold text-white/50">
                      Toca para elegir, arrástrala aquí, o pégala con Ctrl+V
                    </p>
                  </>
                )}
              </button>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer text-xs font-semibold text-amber-300/90 hover:underline"
                  >
                    Cambiar foto
                  </button>
                )}
                <button
                  type="button"
                  onClick={pasteFromClipboard}
                  disabled={pasting}
                  className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-white/60 transition hover:text-amber-300 disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="8" y="2" width="8" height="4" rx="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  </svg>
                  {pasting ? 'Leyendo portapapeles...' : 'Pegar última captura'}
                </button>
              </div>

              {notice && (
                <p className="mt-2 text-xs font-semibold text-amber-300/90">{notice}</p>
              )}

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
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/50">
                  ¿De qué dioses es esta build?
                </p>
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
