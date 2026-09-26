'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

type LogoProps = {
  /** "full" muestra símbolo + nombre; "mark" solo el símbolo. */
  variant?: 'full' | 'mark'
  className?: string
  markClassName?: string
  wordmarkClassName?: string
}

/** Símbolo de PagoIA: una P con borde de recibo y la chispa de la IA. */
export function LogoMark({ className }: { className?: string }) {
  // Id único por instancia: si una copia del logo queda oculta (sidebar en móvil),
  // las demás no pierden el degradado.
  const gradientId = `pagoia-g-${useId().replace(/:/g, '')}`

  return (
    <svg viewBox="9.75 6.75 52 52" className={cn('h-10 w-10 shrink-0', className)} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00D4AA" />
          <stop offset="1" stopColor="#0066FF" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        fillRule="evenodd"
        d="M16 8H38a14 14 0 0 1 0 28H28V56l-3-3-3 3-3-3-3 3Z M28 16.5H37a5.5 5.5 0 0 1 0 11H28Z"
      />
      <path
        className="fill-brand-spark"
        d="M48 42.5Q49.2 48.8 55.5 50Q49.2 51.2 48 57.5Q46.8 51.2 40.5 50Q46.8 48.8 48 42.5Z"
      />
    </svg>
  )
}

export function Logo({ variant = 'full', className, markClassName, wordmarkClassName }: LogoProps) {
  if (variant === 'mark') {
    return (
      <span className={cn('inline-flex', className)} role="img" aria-label="PagoIA">
        <LogoMark className={markClassName} />
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={markClassName} />
      <span className={cn('font-display text-xl font-extrabold tracking-tight text-foreground', wordmarkClassName)}>
        Pago<span className="text-primary">IA</span>
      </span>
    </span>
  )
}
