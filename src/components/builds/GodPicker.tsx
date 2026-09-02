import { memo, useMemo, useState } from 'react'
import type { God } from '../../types'
import { GODS, godImage, normalize } from '../../lib'

const GODS_BY_ID = new Map(GODS.map((g) => [g.id, g]))

interface GodPickerProps {
  selected: string[]
  onToggle: (godId: string) => void
  placeholder?: string
}

export default memo(function GodPicker({
  selected,
  onToggle,
  placeholder = 'Buscar dios...',
}: GodPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return GODS
    return GODS.filter((g) => normalize(g.name).includes(q))
  }, [query])

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const selectedGods = useMemo(
    () => selected.map((id) => GODS_BY_ID.get(id)).filter(Boolean) as God[],
    [selected],
  )

  return (
    <div className="flex flex-col gap-2.5">
      {/* Fijo arriba (no dentro de la grilla con scroll) para ver de un
          vistazo lo ya seleccionado, sea a mano o por "Reconocer dioses". */}
      {selectedGods.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-2">
          {selectedGods.map((god) => (
            <button
              key={god.id}
              type="button"
              onClick={() => onToggle(god.id)}
              className="group flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-400/40 bg-[#0b0e1c] py-1 pl-1 pr-2 text-xs font-bold text-white/85 transition hover:border-rose-400/50"
            >
              <img src={godImage(god)} alt="" className="h-5 w-5 rounded-full object-cover" />
              {god.name}
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-white/40 transition group-hover:text-rose-300"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          ))}
        </div>
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/15 bg-[#0b0e1c] px-3.5 py-2.5 text-sm font-semibold text-white placeholder-white/35 outline-none transition focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
      />
      <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
        {filtered.map((god) => (
          <GodChip
            key={god.id}
            god={god}
            active={selectedSet.has(god.id)}
            onClick={() => onToggle(god.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-4 text-center text-xs text-white/40">
            Ningún dios coincide con “{query}”
          </p>
        )}
      </div>
    </div>
  )
})

const GodChip = memo(function GodChip({
  god,
  active,
  onClick,
}: {
  god: God
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-1.5 transition active:scale-95 ${
        active
          ? 'border-amber-400/60 bg-amber-400/10'
          : 'border-white/10 bg-white/[0.03] hover:border-white/25'
      }`}
    >
      <img
        src={godImage(god)}
        alt=""
        loading="lazy"
        decoding="async"
        className={`h-11 w-11 rounded-lg object-cover transition ${active ? 'god-ring' : 'opacity-80'}`}
      />
      <span className="line-clamp-1 max-w-full text-[10px] font-semibold text-white/80">
        {god.name}
      </span>
    </button>
  )
})
