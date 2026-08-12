import { useMemo } from 'react'

export default function Background() {
  const embers = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        x: `${(i * 37 + 13) % 100}%`,
        size: 4 + ((i * 7) % 6),
        dur: 11 + ((i * 5) % 12),
        delay: ((i * 1.7) % 14),
        drift: `${((i % 2 === 0 ? 1 : -1) * (20 + (i * 9) % 60))}px`,
      })),
    [],
  )

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-aurora bg-veil">
      <div
        className="aurora-blob h-[55vh] w-[45vw] left-[-10%] top-[-15%] bg-purple-700/40"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="aurora-blob h-[50vh] w-[40vw] right-[-12%] top-[10%] bg-emerald-800/40"
        style={{ animationDelay: '-6s', animationDuration: '19s' }}
      />
      <div
        className="aurora-blob h-[45vh] w-[45vw] left-[30%] bottom-[-20%] bg-pink-800/30"
        style={{ animationDelay: '-11s', animationDuration: '22s' }}
      />
      {embers.map((e) => (
        <span
          key={e.id}
          className="ember"
          style={
            {
              '--x': e.x,
              '--size': `${e.size}px`,
              '--dur': `${e.dur}s`,
              '--delay': `-${e.delay}s`,
              '--drift': e.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
