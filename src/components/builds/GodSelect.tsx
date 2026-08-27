import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { GODS, godImageById, normalize } from '../../lib'

export default memo(function GodSelect({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (godId: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedGod = selected ? GODS.find((g) => g.id === selected) : null

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return GODS
    return GODS.filter((g) => normalize(g.name).includes(q))
  }, [query])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const pick = (id: string | null) => {
    onSelect(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="card-glass flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-white/10 px-3.5 py-2.5 text-left transition hover:border-amber-400/40"
      >
        {selectedGod ? (
          <img src={godImageById(selectedGod.id)} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        )}
        <span className="flex-1 truncate text-sm font-semibold text-white/85">
          {selectedGod ? selectedGod.name : 'Todos los dioses'}
        </span>
        {selectedGod && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              pick(null)
            }}
            className="cursor-pointer rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-white/40 transition ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="card-glass absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 flex max-h-80 flex-col overflow-hidden rounded-2xl border-white/10">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar dios..."
            className="border-b border-white/10 bg-transparent px-3.5 py-2.5 text-sm font-semibold text-white placeholder-white/35 outline-none"
          />
          <div className="overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => pick(null)}
              className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left transition hover:bg-white/5"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-400/15 text-sm text-amber-300">✦</span>
              <span className="text-sm font-semibold text-white/85">Todos los dioses</span>
            </button>
            {filtered.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => pick(g.id)}
                className={`flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left transition hover:bg-white/5 ${
                  selected === g.id ? 'bg-amber-400/10' : ''
                }`}
              >
                <img src={godImageById(g.id)} alt="" loading="lazy" decoding="async" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                <span className="truncate text-sm font-semibold text-white/85">{g.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3.5 py-3 text-xs text-white/40">Ningún dios coincide</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
})
