import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Recuadro para elegir/arrastrar/pegar una foto. Se usa tanto en "Nueva
 * build" como en el modo edición del lightbox (para poder reemplazar la
 * foto de una build ya subida) -- monta/desmonta con la sección que lo
 * contiene, así el listener de "pegar" solo escucha mientras hace falta.
 */
export default function PhotoPicker({
  file,
  onChange,
  fallbackPreviewUrl,
}: {
  file: File | null
  onChange: (file: File) => void
  /** Foto ya existente a mostrar mientras no se elija una nueva (modo edición). */
  fallbackPreviewUrl?: string | null
}) {
  const [dragOver, setDragOver] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [pasting, setPasting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pickFile = useCallback(
    (f: File | null) => {
      if (!f || !f.type.startsWith('image/')) {
        if (f) setNotice('Eso no parece una imagen. Prueba con otro archivo.')
        return
      }
      setNotice(null)
      onChange(f)
    },
    [onChange],
  )

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

  // Pegar directo (Ctrl+V) mientras este recuadro está visible, sin
  // necesitar que el foco esté en un input específico.
  useEffect(() => {
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
  }, [pickFile])

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

  const displayUrl = previewUrl ?? fallbackPreviewUrl ?? null

  return (
    <div>
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
        {displayUrl ? (
          <img src={displayUrl} alt="" className="h-full w-full object-contain" />
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
        {displayUrl && (
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

      {notice && <p className="mt-2 text-xs font-semibold text-amber-300/90">{notice}</p>}
    </div>
  )
}
