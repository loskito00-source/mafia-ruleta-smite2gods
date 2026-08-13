import { useEffect, useMemo } from 'react'

export default function Background() {
  const embers = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: `${(i * 37 + 13) % 100}%`,
        size: 4 + ((i * 7) % 6),
        dur: 11 + ((i * 5) % 12),
        delay: ((i * 1.7) % 14),
        drift: `${((i % 2 === 0 ? 1 : -1) * (20 + (i * 9) % 60))}px`,
      })),
    [],
  )

  useEffect(() => {
    const toggle = () => {
      document.documentElement.classList.toggle('paused', document.hidden)
    }
    document.addEventListener('visibilitychange', toggle)
    return () => document.removeEventListener('visibilitychange', toggle)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-aurora bg-veil">
      <div className="aurora-blob aurora-purple h-[55vh] w-[45vw] left-[-10%] top-[-15%]" />
      <div
        className="aurora-blob aurora-emerald h-[50vh] w-[40vw] right-[-12%] top-[10%]"
        style={{ animationDelay: '-6s', animationDuration: '20s' }}
      />
      <div
        className="aurora-blob aurora-pink h-[45vh] w-[45vw] left-[30%] bottom-[-20%]"
        style={{ animationDelay: '-11s', animationDuration: '24s' }}
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
