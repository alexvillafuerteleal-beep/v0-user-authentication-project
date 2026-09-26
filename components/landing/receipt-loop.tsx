'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(useGSAP)

const STEPS = ['Escanea tu recibo', 'Revisa monto y fecha', 'Paga y listo']

/**
 * Loop de ~10 s que cuenta el producto sin palabras: un recibo de papel se escanea,
 * se convierte en una tarjeta digital y se marca como pagado. Es vectorial, así que
 * pesa lo mismo que un componente y no necesita archivo de video.
 */
export function ReceiptLoop({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const setStep = (i: number) => () =>
        q('[data-step]').forEach((el, idx) => el.toggleAttribute('data-active', idx === i))

      if (reduce) {
        gsap.set(q('[data-receipt]'), { opacity: 0 })
        gsap.set(q('[data-scan]'), { opacity: 0 })
        gsap.set(q('[data-spark]'), { opacity: 0 })
        gsap.set(q('[data-card]'), { opacity: 1 })
        gsap.set(q('[data-due]'), { opacity: 0 })
        gsap.set(q('[data-paid]'), { opacity: 1 })
        setStep(2)()
        return
      }

      gsap.set(q('[data-card]'), { opacity: 0, scale: 0.94, transformOrigin: '50% 50%' })
      gsap.set(q('[data-spark]'), { scale: 0, transformOrigin: '50% 50%' })
      gsap.set(q('[data-check]'), { strokeDasharray: 40, strokeDashoffset: 40 })
      gsap.set(q('[data-paid]'), { opacity: 0 })

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 })
      tl.call(setStep(0), [], 0)
        .fromTo(q('[data-receipt]'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0)
        .fromTo(q('[data-scan]'), { y: 0, opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.6)
        .to(q('[data-scan]'), { y: 176, duration: 1.6, ease: 'sine.inOut' }, 0.6)
        .to(q('[data-scan]'), { opacity: 0, duration: 0.2 }, 2.2)
        .call(setStep(1), [], 2.3)
        .to(q('[data-receipt]'), { opacity: 0, scale: 0.92, transformOrigin: '50% 50%', duration: 0.5, ease: 'power2.in' }, 2.3)
        .to(q('[data-card]'), { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, 2.6)
        .call(setStep(2), [], 5.0)
        .to(q('[data-spark]'), { scale: 1, rotation: 90, duration: 0.45, ease: 'back.out(2.2)' }, 5.0)
        .to(q('[data-spark]'), { scale: 0, duration: 0.25, ease: 'power2.in' }, 5.7)
        .to(q('[data-check]'), { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' }, 5.8)
        .to(q('[data-due]'), { opacity: 0, duration: 0.2 }, 5.8)
        .to(q('[data-paid]'), { opacity: 1, duration: 0.25 }, 5.9)
        .to(q('[data-card]'), { opacity: 0, y: -8, duration: 0.5, ease: 'power2.in' }, 9.0)
        .set(q('[data-card]'), { y: 0, scale: 0.94 }, 9.5)
        .set(q('[data-check]'), { strokeDashoffset: 40 }, 9.5)
        .set(q('[data-due]'), { opacity: 1 }, 9.5)
        .set(q('[data-paid]'), { opacity: 0 }, 9.5)
        .set(q('[data-spark]'), { rotation: 0 }, 9.5)
        .set(q('[data-receipt]'), { scale: 1 }, 9.5)
    },
    { scope: root },
  )

  return (
    <div ref={root} className={cn('flex flex-col gap-4', className)}>
      <svg
        viewBox="0 0 320 240"
        className="h-auto w-full"
        role="img"
        aria-label="Un recibo de luz se escanea, se convierte en una tarjeta con el monto de $486.00 y se marca como pagado"
      >
        <defs>
          <linearGradient id="rl-scan" x1="0" x2="1">
            <stop offset="0" stopColor="#00D4AA" stopOpacity="0" />
            <stop offset="0.5" stopColor="#00D4AA" />
            <stop offset="1" stopColor="#00D4AA" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Recibo de papel */}
        <g data-receipt>
          <path d="M100 24h120v184l-10-7-10 7-10-7-10 7-10-7-10 7-10-7-10 7-10-7-10 7-10-7-10 7Z" fill="#F4F7FA" />
          <rect x="114" y="40" width="34" height="9" rx="2" fill="#0A1929" opacity=".85" />
          <rect x="114" y="58" width="92" height="5" rx="2" fill="#94A3B8" />
          <rect x="114" y="70" width="70" height="5" rx="2" fill="#94A3B8" />
          <rect x="114" y="92" width="92" height="1" fill="#CBD5E1" />
          <rect x="114" y="104" width="48" height="5" rx="2" fill="#94A3B8" />
          <rect x="176" y="104" width="30" height="5" rx="2" fill="#94A3B8" />
          <rect x="114" y="116" width="40" height="5" rx="2" fill="#94A3B8" />
          <rect x="176" y="116" width="30" height="5" rx="2" fill="#94A3B8" />
          <rect x="114" y="146" width="44" height="7" rx="2" fill="#0A1929" opacity=".7" />
          <rect x="168" y="144" width="38" height="11" rx="2" fill="#0A1929" opacity=".85" />
          <rect x="114" y="170" width="92" height="12" rx="2" fill="#CBD5E1" />
        </g>
        <rect data-scan x="88" y="24" width="144" height="3" rx="1.5" fill="url(#rl-scan)" opacity="0" />

        {/* Tarjeta digital */}
        <g data-card style={{ opacity: 0 }}>
          <rect x="50" y="54" width="220" height="132" rx="16" fill="rgba(255,255,255,0.06)" stroke="rgba(0,212,170,0.45)" />
          <text x="74" y="88" fill="#8FA3BD" fontSize="13" fontFamily="var(--font-geist-sans), system-ui, sans-serif">
            Luz · CFE
          </text>
          <text
            x="74"
            y="126"
            fill="#FFFFFF"
            fontSize="34"
            fontWeight="700"
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
          >
            $486.00
          </text>
          <g data-due>
            <rect x="74" y="146" width="112" height="24" rx="12" fill="rgba(251,191,36,0.14)" />
            <text x="130" y="162" textAnchor="middle" fill="#FBBF24" fontSize="12" fontFamily="var(--font-geist-sans), system-ui, sans-serif">
              Vence 12 oct
            </text>
          </g>
          <g data-paid style={{ opacity: 0 }}>
            <rect x="74" y="146" width="92" height="24" rx="12" fill="rgba(0,212,170,0.16)" />
            <text x="120" y="162" textAnchor="middle" fill="#2EE0BC" fontSize="12" fontFamily="var(--font-geist-sans), system-ui, sans-serif">
              Pagado
            </text>
          </g>
          <circle cx="232" cy="92" r="18" fill="rgba(0,212,170,0.12)" />
          <path data-check d="M223 92l6 6 12-13" fill="none" stroke="#2EE0BC" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path
            data-spark
            d="M232 76Q234.2 89.8 248 92Q234.2 94.2 232 108Q229.8 94.2 216 92Q229.8 89.8 232 76Z"
            fill="#F0479F"
          />
        </g>
      </svg>

      <ol className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            data-step
            data-active={i === 0 ? '' : undefined}
            className="rounded-lg border border-white/10 px-2 py-2 text-slate-400 transition-colors duration-300 data-[active]:border-brand-teal/50 data-[active]:bg-brand-teal/10 data-[active]:text-white"
          >
            <span className="mr-1 font-mono text-brand-teal">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
    </div>
  )
}
