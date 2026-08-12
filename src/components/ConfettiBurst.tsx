import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  color: string
  rot: number
  vr: number
  life: number
}

const COLORS = ['#f5c542', '#ff3b5c', '#5eead4', '#a78bfa', '#38bdf8', '#fff6d8', '#ff8c42']

export default function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])

  useEffect(() => {
    if (!burstKey) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { innerWidth: W, innerHeight: H } = window
    canvas.width = W
    canvas.height = H

    const spawn = () => {
      const count = 180
      const originY = H * 0.32
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 6 + Math.random() * 9
        particles.current.push({
          x: W / 2 + (Math.random() - 0.5) * 120,
          y: originY,
          vx: Math.cos(angle) * speed * (0.6 + Math.random()),
          vy: Math.sin(angle) * speed - 4,
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 8,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          life: 1,
        })
      }
    }

    spawn()

    let raf = 0
    const step = () => {
      const p = particles.current
      ctx.clearRect(0, 0, W, H)
      for (let i = p.length - 1; i >= 0; i--) {
        const pt = p[i]
        pt.vy += 0.18
        pt.x += pt.vx
        pt.y += pt.vy
        pt.rot += pt.vr
        pt.life -= 0.008
        if (pt.y > H + 40 || pt.life <= 0) {
          p.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.globalAlpha = Math.max(pt.life, 0)
        ctx.translate(pt.x, pt.y)
        ctx.rotate(pt.rot)
        ctx.fillStyle = pt.color
        ctx.shadowColor = pt.color
        ctx.shadowBlur = 8
        ctx.fillRect(-pt.w / 2, -pt.h / 2, pt.w, pt.h)
        ctx.restore()
      }
      if (p.length) raf = requestAnimationFrame(step)
      else ctx.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [burstKey])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-40"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
