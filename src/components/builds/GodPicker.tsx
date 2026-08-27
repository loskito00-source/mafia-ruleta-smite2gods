import { memo, useMemo, useState } from 'react'
import type { God } from '../../types'
import { GODS, godImage, normalize } from '../../lib'

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

  return (
    <div className="flex flex-col gap-2.5">
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
      {selected.length > 0 && (
        <p className="text-xs font-semibold text-amber-300/80">
          {selected.length} dios{selected.length === 1 ? '' : 'es'} seleccionado
          {selected.length === 1 ? '' : 's'}
        </p>
      )}
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
