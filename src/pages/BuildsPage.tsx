import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Build, God } from '../types'
import { GODS } from '../lib'
import { useBuilds } from '../lib/builds'
import BuildCard from '../components/builds/BuildCard'
import GodSelect from '../components/builds/GodSelect'
import AddBuildSheet from '../components/builds/AddBuildSheet'
import BuildLightbox from '../components/builds/BuildLightbox'

const GODS_BY_ID = new Map(GODS.map((g) => [g.id, g]))

function AddBuildButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="btn-sortear grid h-11 w-11 cursor-pointer place-items-center rounded-full text-[#3a2a05]"
      title="Agregar build"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </motion.button>
  )
}

export default function BuildsPage() {
  const { data: builds, isLoading, isError, error } = useBuilds()
  const [godFilter, setGodFilter] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [active, setActive] = useState<Build | null>(null)

  const filtered = useMemo(() => {
    if (!builds) return []
    if (!godFilter) return builds
    return builds.filter((b) => b.godIds.includes(godFilter))
  }, [builds, godFilter])

  const activeGods: God[] = active
    ? (active.godIds.map((id) => GODS_BY_ID.get(id)).filter(Boolean) as God[])
    : []

  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 pb-10 pt-8 sm:pt-10">
      <Link
        to="/"
        className="card-glass fixed left-4 top-4 z-40 flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-white/70 transition hover:text-amber-300"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Inicio
      </Link>

      {/* Móvil: botón flotante arriba a la derecha. */}
      <div className="fixed right-4 top-4 z-40 sm:hidden">
        <AddBuildButton onClick={() => setAddOpen(true)} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14 }}
        className="mt-10 text-center sm:mt-6"
      >
        <h1 className="title-gradient title-shimmer font-display text-3xl font-black uppercase tracking-widest sm:text-4xl">
          Builds de Dioses
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">
          Busca la build de un dios o mira todas las que hay guardadas.
        </p>
      </motion.div>

      <div className="flex items-center gap-3">
        <GodSelect selected={godFilter} onSelect={setGodFilter} />
        {/* Escritorio: mismo botón, en la fila del filtro pero al otro extremo. */}
        <div className="ml-auto hidden shrink-0 sm:block">
          <AddBuildButton onClick={() => setAddOpen(true)} />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-sm text-rose-300">
          {(error as Error)?.message ?? 'Error cargando las builds.'}
        </p>
      )}

      {!isLoading && !isError && (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="text-white/50">
                {godFilter ? 'Este dios todavía no tiene builds.' : 'Todavía no hay builds guardadas.'}
              </p>
              <button
                onClick={() => setAddOpen(true)}
                className="cursor-pointer text-sm font-bold text-amber-300 hover:underline"
              >
                Agregar la primera
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((b) => {
                const primaryId = godFilter && b.godIds.includes(godFilter) ? godFilter : b.godIds[0]
                const primaryGod = GODS_BY_ID.get(primaryId)
                if (!primaryGod) return null
                return (
                  <BuildCard
                    key={b.id}
                    build={b}
                    primaryGod={primaryGod}
                    extraCount={b.godIds.length - 1}
                    onOpen={() => setActive(b)}
                  />
                )
              })}
            </div>
          )}
        </>
      )}

      <AddBuildSheet open={addOpen} onClose={() => setAddOpen(false)} defaultGodId={godFilter} />
      <BuildLightbox
        build={active}
        gods={activeGods}
        onClose={() => setActive(null)}
        onSelectGod={(id) => {
          setGodFilter(id)
          setActive(null)
        }}
      />
    </main>
  )
}
