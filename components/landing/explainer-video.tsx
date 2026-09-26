"use client"

import { useEffect, useRef } from "react"

/**
 * Video explicativo de 50 s (subtitulado, sin audio). Se reproduce en silencio al entrar en
 * pantalla y se pausa al salir. Con prefers-reduced-motion o ahorro de datos no se reproduce
 * solo: queda el poster con los controles.
 */
export function ExplainerVideo() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (reduce || saveData) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => undefined)
        else video.pause()
      },
      { threshold: 0.5 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      className="aspect-video w-full rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-2xl"
      poster="/video/pagoia-explicativo-poster.webp"
      controls
      muted
      playsInline
      preload="none"
      aria-label="Video de 50 segundos: cómo PagoIA junta tus recibos, los captura con una foto, pronostica el siguiente y te deja pagarlo"
    >
      <source src="/video/pagoia-explicativo.mp4" type="video/mp4" />
    </video>
  )
}
