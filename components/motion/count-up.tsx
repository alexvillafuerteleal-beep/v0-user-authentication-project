'use client'

import { useEffect, useRef, useState } from 'react'

type CountUpProps = {
  value: number
  prefix?: string
  decimals?: number
  /** Duración en milisegundos. */
  duration?: number
  className?: string
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/** Cuenta desde el último valor mostrado hasta `value`. Usa cifras tabulares para que el ancho no salte. */
export function CountUp({ value, prefix = '', decimals = 0, duration = 600, className }: CountUpProps) {
  const [display, setDisplay] = useState(value)
  const from = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      from.current = value
      return
    }
    const start = performance.now()
    const initial = from.current
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setDisplay(initial + (value - initial) * easeOutCubic(t))
      if (t < 1) frame = requestAnimationFrame(tick)
      else from.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  const text = display.toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}{text}</span>
}
