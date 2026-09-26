'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

type PaymentSuccessProps = {
  open: boolean
  description: string
  onClose: () => void
}

/**
 * Confirmación de pago: sale un recibo "impreso" con borde dentado y la chispa
 * se convierte en palomita. Se cierra sola a los 3.2 s o con clic / Escape.
 */
export function PaymentSuccess({ open, description, onClose }: PaymentSuccessProps) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(onClose, 3200)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useGSAP(
    () => {
      if (!open) return
      const q = gsap.utils.selector(root)
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(q('[data-spark]'), { opacity: 0 })
        return
      }
      gsap
        .timeline()
        .from(q('[data-backdrop]'), { opacity: 0, duration: 0.2 })
        .from(q('[data-paper]'), { yPercent: -100, duration: 0.55, ease: 'power2.out' }, 0.1)
        .from(q('[data-spark]'), { scale: 0, rotation: -90, transformOrigin: '50% 50%', duration: 0.35, ease: 'back.out(2.2)' }, 0.55)
        .to(q('[data-spark]'), { scale: 0, duration: 0.2, ease: 'power2.in' }, 0.95)
        .from(q('[data-check]'), { strokeDashoffset: 30, duration: 0.3, ease: 'power2.out' }, 1.0)
        .from(q('[data-text]'), { opacity: 0, y: 6, duration: 0.3 }, 1.05)
    },
    { scope: root, dependencies: [open] },
  )

  if (!open) return null

  return (
    <div ref={root} className="fixed inset-0 z-[60] flex items-center justify-center p-6" role="status" aria-live="polite">
      <button
        data-backdrop
        type="button"
        aria-label="Cerrar confirmación"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <div className="relative flex flex-col items-center gap-4">
        <div className="overflow-hidden pb-2">
          <svg data-paper viewBox="0 0 120 150" className="h-40 w-32 drop-shadow-xl" aria-hidden="true">
            <path d="M0 0h120v140l-10-8-10 8-10-8-10 8-10-8-10 8-10-8-10 8-10-8-10 8-10-8-10 8Z" className="fill-card stroke-border" />
            <rect x="16" y="18" width="40" height="8" rx="2" className="fill-muted-foreground/40" />
            <rect x="16" y="34" width="88" height="5" rx="2" className="fill-muted-foreground/25" />
            <rect x="16" y="45" width="64" height="5" rx="2" className="fill-muted-foreground/25" />
            <circle cx="60" cy="92" r="22" className="fill-primary/15" />
            <path
              data-check
              d="M49 92l8 8 15-17"
              fill="none"
              className="stroke-primary"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="30"
            />
            <path
              data-spark
              d="M60 74Q62.6 89.4 78 92Q62.6 94.6 60 110Q57.4 94.6 42 92Q57.4 89.4 60 74Z"
              className="fill-brand-spark"
            />
          </svg>
        </div>
        <div data-text className="text-center">
          <p className="font-display text-2xl font-extrabold text-foreground">Pago completado</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}
