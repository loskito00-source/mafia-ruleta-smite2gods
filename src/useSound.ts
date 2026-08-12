import { useCallback, useRef } from 'react'

let ctx: AudioContext | null = null

function audio() {
  if (!ctx) {
    ctx = new AudioContext()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, filterFreq = 2600) {
  const c = audio()
  const osc = c.createOscillator()
  const filter = c.createBiquadFilter()
  const g = c.createGain()
  const t0 = c.currentTime + delay
  osc.type = type
  osc.frequency.value = freq
  filter.type = 'lowpass'
  filter.frequency.value = filterFreq
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(filter).connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

// Gentle pentatonic bell — no harsh step ever lands on a dissonant interval.
const TICK_SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319]

export function useSound(enabled: boolean) {
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const tick = useCallback((step: number) => {
    if (!enabledRef.current) return
    tone(TICK_SCALE[step % TICK_SCALE.length], 0.1, 'triangle', 0.035, 0, 3200)
  }, [])

  const spinStart = useCallback(() => {
    if (!enabledRef.current) return
    const c = audio()
    const osc = c.createOscillator()
    const filter = c.createBiquadFilter()
    const g = c.createGain()
    const t0 = c.currentTime
    osc.type = 'sine'
    filter.type = 'lowpass'
    filter.frequency.value = 1800
    osc.frequency.setValueAtTime(220, t0)
    osc.frequency.exponentialRampToValueAtTime(90, t0 + 0.5)
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(0.05, t0 + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55)
    osc.connect(filter).connect(g).connect(c.destination)
    osc.start(t0)
    osc.stop(t0 + 0.6)
  }, [])

  const reveal = useCallback(() => {
    if (!enabledRef.current) return
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'triangle', 0.05, i * 0.1, 2800))
    tone(1568, 1.1, 'triangle', 0.04, 0.55, 2200)
  }, [])

  return { tick, spinStart, reveal }
}
