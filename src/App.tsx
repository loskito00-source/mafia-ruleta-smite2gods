import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import type { Phase, Player, Team } from './types'
import { DEFAULT_PLAYERS, GODS, godImage, pickRandom, shuffled } from './lib'
import { pressable, sectionEnter, sectionExit, springGentle } from './lib/motion'
import { useSound } from './useSound'
import { usePlayers } from './usePlayers'
import Background from './components/Background'
import ConfettiBurst from './components/ConfettiBurst'
import PlayerAvatar from './components/PlayerAvatar'
import RouletteSlot from './components/RouletteSlot'
import TeamPanel from './components/TeamPanel'

interface Draw {
  teamA: Team
  teamB: Team
}

function makeDraw(selected: Player[]): Draw {
  const order = shuffled(selected)
  const mid = Math.ceil(order.length / 2)
  const teamA = order.slice(0, mid)
  const teamB = order.slice(mid)
  const gods = pickRandom(GODS, order.length)
  return {
    teamA: {
      name: 'Equipo Oro',
      accent: 'gold',
      players: teamA.map((player, i) => ({ player, god: gods[i] })),
    },
    teamB: {
      name: 'Equipo Hielo',
      accent: 'ice',
      players: teamB.map((player, i) => ({ player, god: gods[mid + i] })),
    },
  }
}

export default function App() {
  const { players, addPlayer, removePlayer } = usePlayers()
  const [phase, setPhase] = useState<Phase>('lobby')
  const [draw, setDraw] = useState<Draw | null>(null)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(players.map((p) => p.id)),
  )
  const [, setDoneCount] = useState(0)
  const [burstKey, setBurstKey] = useState(0)
  const [muted, setMuted] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const { tick, spinStart, reveal } = useSound(!muted)

  useEffect(() => {
    const srcs = GODS.map((g) => godImage(g))
    let i = 0
    let timer = 0
    const warm = () => {
      const end = Math.min(i + 6, srcs.length)
      for (; i < end; i++) {
        const img = new Image()
        img.decoding = 'async'
        img.src = srcs[i]
      }
      if (i < srcs.length) timer = window.setTimeout(warm, 120)
    }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 2500 })
      return () => {
        window.cancelIdleCallback(id)
        clearTimeout(timer)
      }
    }
    warm()
    return () => clearTimeout(timer)
  }, [])

  const togglePlayer = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(
    () => setSelected(new Set(players.map((p) => p.id))),
    [players],
  )
  const clearAll = useCallback(() => setSelected(new Set()), [])

  const handleAddPlayer = useCallback(() => {
    const player = addPlayer(newPlayerName)
    if (player) {
      setSelected((prev) => new Set(prev).add(player.id))
      setNewPlayerName('')
    }
  }, [addPlayer, newPlayerName])

  const handleRemovePlayer = useCallback(
    (id: string) => {
      removePlayer(id)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    },
    [removePlayer],
  )

  const selectedPlayers = useMemo(
    () => players.filter((p) => selected.has(p.id)),
    [players, selected],
  )
  const canStart = selectedPlayers.length >= 2

  const startDraw = useCallback(() => {
    if (!canStart) return
    const d = makeDraw(selectedPlayers)
    setDraw(d)
    setDoneCount(0)
    setPhase('spinning')
    spinStart()
  }, [canStart, selectedPlayers, spinStart])

  const onSlotDone = useCallback(() => {
    setDoneCount((n) => {
      const next = n + 1
      if (next === selectedPlayers.length) {
        setTimeout(() => {
          setPhase('result')
          setBurstKey((k) => k + 1)
          reveal()
        }, 250)
      }
      return next
    })
  }, [selectedPlayers.length, reveal])

  const rerollGod = useCallback((teamKey: 'teamA' | 'teamB', index: number) => {
    setDraw((prev) => {
      if (!prev) return prev
      const team = prev[teamKey]
      const used = new Set(
        [...prev.teamA.players, ...prev.teamB.players].map((s) => s.god.id),
      )
      used.delete(team.players[index].god.id)
      const pool = GODS.filter((g) => !used.has(g.id))
      const nextGod = pool[Math.floor(Math.random() * pool.length)]
      const players = team.players.map((s, i) =>
        i === index ? { ...s, god: nextGod } : s,
      )
      return { ...prev, [teamKey]: { ...team, players } }
    })
  }, [])

  const goToLobby = useCallback(() => {
    setPhase('lobby')
    setDraw(null)
  }, [])

  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen">
      <Background />
      <ConfettiBurst burstKey={burstKey} />

      {/* Mute toggle */}
      <button
        onClick={() => setMuted((m) => !m)}
        className="card-glass fixed right-4 top-4 z-50 grid h-11 w-11 cursor-pointer place-items-center rounded-full text-amber-300 transition hover:scale-110"
        title={muted ? 'Activar sonido' : 'Silenciar'}
      >
        {muted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-4 py-10">
        {/* ===== Header ===== */}
        <motion.header
          className="text-center"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 14 }}
        >
          <h1 className="title-gradient title-shimmer font-display text-4xl font-black tracking-widest uppercase sm:text-5xl">
            Ruleta de Dioses
          </h1>
          <motion.p
            className="mx-auto mt-3 max-w-xl text-sm text-white/60 sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            Presiona el botón y deja que los dioses decidan quién combate contra quién.
          </motion.p>
        </motion.header>

        <AnimatePresence mode="wait">
          {/* ===== LOBBY ===== */}
          {phase === 'lobby' && (
            <motion.section
              key="lobby"
              className="flex w-full flex-col items-center gap-8"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20, transition: sectionExit }}
              transition={sectionEnter}
            >
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springGentle, delay: 0.1 }}
                className="flex items-center gap-3"
              >
                <motion.span
                  key={selectedPlayers.length}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                  className="grid h-9 min-w-9 place-items-center rounded-full bg-amber-400/15 px-3 font-display text-lg font-black text-amber-300"
                  style={{ boxShadow: '0 0 18px -6px rgba(245,197,66,0.7)' }}
                >
                  {selectedPlayers.length}
                </motion.span>
                <p className="text-sm text-white/60">
                  {selectedPlayers.length === players.length
                    ? `Juegan todos (${players.length}) - ${Math.ceil(players.length / 2)} vs ${Math.floor(players.length / 2)}`
                    : 'jugadores en partida'}
                </p>
                <div className="mx-1 h-5 w-px bg-white/15" />
                <button
                  onClick={selectAll}
                  className="cursor-pointer rounded-full border border-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/70 transition hover:border-amber-400/50 hover:text-amber-300"
                >
                  Todos
                </button>
                <button
                  onClick={clearAll}
                  className="cursor-pointer rounded-full border border-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/70 transition hover:border-rose-400/50 hover:text-rose-300"
                >
                  Ninguno
                </button>
              </motion.div>

              <div className="grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
                {players.map((p, i) => {
                  const active = selected.has(p.id)
                  const isCustom = !DEFAULT_PLAYERS.some((d) => d.id === p.id)
                  return (
                    <motion.div
                      key={p.id}
                      role="button"
                      onClick={() => togglePlayer(p.id)}
                      className="card-glass relative flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition"
                      style={{
                        borderColor: active ? 'rgba(245,197,66,0.5)' : 'rgba(255,255,255,0.08)',
                        boxShadow: active
                          ? '0 0 0 1px rgba(245,197,66,0.2), 0 18px 44px -24px rgba(245,197,66,0.35)'
                          : undefined,
                      }}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: active ? 1 : 0.45, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ delay: 0.15 + i * 0.045, type: 'spring', stiffness: 260, damping: 22 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <PlayerAvatar player={p} size={44} floatDelay={i * 0.15} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-black uppercase tracking-wide text-white">
                          {p.name}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">
                          {isCustom ? 'Jugador extra' : 'Jugador'}
                        </p>
                      </div>
                      <span
                        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                          active ? 'border-amber-400/60 bg-amber-400/20' : 'border-white/15 bg-white/5'
                        }`}
                      >
                        <motion.span
                          className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white"
                          animate={{ x: active ? 20 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                          style={active ? { boxShadow: '0 0 10px rgba(245,197,66,0.7)' } : undefined}
                        />
                      </span>
                      {isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemovePlayer(p.id)
                          }}
                          title={`Quitar a ${p.name}`}
                          className="absolute -right-2 -top-2 grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-white/15 bg-[#1b1e33] text-white/50 transition hover:border-rose-400/60 hover:text-rose-300"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springGentle, delay: 0.35 }}
                className="card-glass flex w-full max-w-xl items-center gap-2 rounded-2xl border border-white/10 p-2 pl-3"
              >
                <input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddPlayer()
                  }}
                  maxLength={20}
                  placeholder="Nombre del jugador..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white placeholder-white/30 outline-none"
                />
                <button
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName.trim()}
                  className="cursor-pointer rounded-full border border-amber-400/40 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-300 transition hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30"
                >
                  Agregar
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={startDraw}
                  disabled={!canStart}
                  whileHover={canStart ? pressable.whileHover : undefined}
                  whileTap={canStart ? pressable.whileTap : undefined}
                  transition={pressable.transition}
                  className={`cursor-pointer rounded-full px-10 py-4 font-display text-xl font-black uppercase tracking-widest transition ${
                    canStart
                      ? 'btn-sortear pulse-ring text-[#3a2a05]'
                      : 'cursor-not-allowed bg-[#22243a] text-white/30'
                  }`}
                >
                  Sortear equipos
                </motion.button>
                {!canStart && (
                  <p className="mt-3 text-center text-sm text-rose-300/90">
                    Selecciona al menos 2 jugadores para sortear
                  </p>
                )}
              </motion.div>
            </motion.section>
          )}

          {/* ===== SPINNING ===== */}
          {phase === 'spinning' && draw && (
            <motion.section
              key="spinning"
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.04, transition: sectionExit }}
              transition={sectionEnter}
            >
              <motion.p
                className="font-display text-lg font-bold uppercase tracking-[0.3em] text-amber-300"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                Sorteando el destino...
              </motion.p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                {[...draw.teamA.players, ...draw.teamB.players].map((slot, i) => (
                  <RouletteSlot
                    key={slot.player.id}
                    player={slot.player}
                    finalGod={slot.god}
                    delay={i * 0.12}
                    spinDuration={2400 + (i % 3) * 400}
                    onDone={onSlotDone}
                    tick={tick}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* ===== RESULT ===== */}
          {phase === 'result' && draw && (
            <motion.section
              key="result"
              className="flex w-full flex-col items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: sectionExit }}
              transition={sectionEnter}
            >
              <motion.h2
                className="title-gradient font-display text-3xl font-black uppercase tracking-widest sm:text-4xl"
                initial={{ scale: 2, opacity: 0, rotateX: 90 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                transition={{ type: 'spring', stiffness: 140, damping: 13, delay: 0.1 }}
              >
                ¡Que empiece la batalla!
              </motion.h2>
              <div className="flex w-full flex-col items-center justify-center gap-6 lg:flex-row lg:items-start lg:gap-8">
                <TeamPanel team={draw.teamA} index={0} onReroll={(i) => rerollGod('teamA', i)} tick={tick} />
                <motion.div
                  className="font-display text-4xl font-black text-amber-300 sm:text-5xl"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55, type: 'spring', stiffness: 200, damping: 10 }}
                  style={{ textShadow: '0 0 30px rgba(245,197,66,0.8)' }}
                >
                  VS
                </motion.div>
                <TeamPanel team={draw.teamB} index={1} onReroll={(i) => rerollGod('teamB', i)} tick={tick} />
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-4">
                <motion.button
                  onClick={startDraw}
                  whileHover={pressable.whileHover}
                  whileTap={pressable.whileTap}
                  className="btn-sortear cursor-pointer rounded-full px-8 py-3 font-display text-lg font-black uppercase tracking-widest text-[#3a2a05]"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.15, ...pressable.transition }}
                >
                  Sortear de nuevo
                </motion.button>
                <motion.button
                  onClick={goToLobby}
                  whileHover={pressable.whileHover}
                  whileTap={pressable.whileTap}
                  className="cursor-pointer rounded-full border border-white/15 bg-white/5 px-8 py-3 font-display text-lg font-black uppercase tracking-widest text-white/80 transition hover:border-amber-400/50 hover:text-amber-300"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.25, ...pressable.transition }}
                >
                  Elegir jugadores
                </motion.button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
    </MotionConfig>
  )
}
