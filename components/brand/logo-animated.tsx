'use client'

import { useId, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(useGSAP)

type LogoAnimatedProps = {
  className?: string
  /** Repite la animación (pantallas de carga). Sin loop se reproduce una vez. */
  loop?: boolean
  /** Anima solo la chispa, para confirmar un pago. */
  sparkOnly?: boolean
}

/**
 * Símbolo de PagoIA animado en 1.4 s: la base de la P crece, aparece la curva
 * y al final la chispa de la IA. Con prefers-reduced-motion se muestra estático.
 */
export function LogoAnimated({ className, loop = false, sparkOnly = false }: LogoAnimatedProps) {
  const root = useRef<SVGSVGElement>(null)
  const gradientId = `pagoia-ga-${useId().replace(/:/g, '')}`

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const tl = gsap.timeline({ repeat: loop ? -1 : 0, repeatDelay: 0.9 })
      if (!sparkOnly) {
        tl.from('[data-part="stem"]', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.4, ease: 'power2.out' }, 0)
          .from('[data-part="bowl"]', { scaleX: 0, opacity: 0, transformOrigin: '0% 50%', duration: 0.5, ease: 'power2.inOut' }, 0.3)
      }
      tl.from(
        '[data-part="spark"]',
        { scale: 0, rotation: -90, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(2.2)' },
        sparkOnly ? 0 : 1.0,
      )
    },
    { scope: root, dependencies: [loop, sparkOnly] },
  )

  return (
    <svg ref={root} viewBox="9.75 6.75 52 52" className={cn('h-16 w-16', className)} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="16" y1="8" x2="55.5" y2="57.5">
          <stop offset="0" stopColor="#00D4AA" />
          <stop offset="1" stopColor="#0066FF" />
        </linearGradient>
      </defs>
      <path data-part="stem" fill={`url(#${gradientId})`} d="M16 8H28V56l-3-3-3 3-3-3-3 3Z" />
      <path
        data-part="bowl"
        fill={`url(#${gradientId})`}
        d="M27.5 8H38a14 14 0 0 1 0 28H27.5V27.5H37a5.5 5.5 0 0 0 0-11H27.5Z"
      />
      <path
        data-part="spark"
        className="fill-brand-spark"
        d="M48 42.5Q49.2 48.8 55.5 50Q49.2 51.2 48 57.5Q46.8 51.2 40.5 50Q46.8 48.8 48 42.5Z"
      />
    </svg>
  )
}
