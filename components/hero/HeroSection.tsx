"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHeroAnimation } from "@/hooks/use-hero-animation"
import { ReceiptLoop } from "@/components/landing/receipt-loop"

/**
 * Sección hero principal de la página de inicio de PagoIA.
 *
 * Muestra el titular, subtítulo, llamadas a la acción, la escena 3D
 * con órbitas de proveedores y el panel informativo lateral.
 * Aplica animaciones GSAP de entrada y ligadas al scroll.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useHeroAnimation({
    sectionRef,
    taglineRef,
    titleRef,
    subtitleRef,
    ctaRef,
    sceneRef,
    panelRef,
  })

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-6 py-20 md:px-8 md:py-32"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Texto central del hero */}
        <div className="text-center space-y-6 mb-16">
          <p
            ref={taglineRef}
            className="text-xs uppercase tracking-[0.5em] text-cyan-300"
          >
            Pago de servicios en México
          </p>

          <h1
            ref={titleRef}
            className="text-5xl md:text-7xl font-bold text-foreground leading-tight hero-title-3d"
          >
            Tus servicios,
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              sin sorpresas.
            </span>
          </h1>

          <p
            ref={subtitleRef}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light"
          >
            Luz, agua, gas e internet en un solo panel. PagoIA te dice cuánto
            vas a pagar y te avisa antes de cada vencimiento.
          </p>

          <div
            ref={ctaRef}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg px-8 font-semibold text-base h-12"
            >
              <Link href="/auth/register">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-lg px-8 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-semibold text-base h-12"
            >
              <Link href="#como-funciona">Ver cómo funciona</Link>
            </Button>
          </div>
        </div>

        {/* Escena 3D y panel lateral */}
        <div id="medios" className="mt-16 grid gap-8 lg:grid-cols-[1.25fr_1fr] items-center">
          {/* Escena 3D con órbitas y tarjetas */}
          <div ref={sceneRef} className="hero-3d-scene">
            <div className="hero-orb" />
            <div className="hero-orbit hero-orbit-1">CFE</div>
            <div className="hero-orbit hero-orbit-2">CONAGUA</div>
            <div className="hero-orbit hero-orbit-3">PEMEX</div>
            <div className="hero-orbit hero-orbit-4">TELMEX</div>

            <div className="hero-card hero-card-main">
              <div className="relative h-full w-full overflow-hidden rounded-xl border border-cyan-300/25 bg-slate-950/60 p-4">
                <Image
                  src="/screens/dashboard.webp"
                  alt="Panel de PagoIA con pagos, vencimientos y pronóstico de gastos"
                  fill
                  className="object-cover opacity-90"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/90">
                    Todo en un panel
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Pagos, vencimientos y pronóstico de gastos
                  </p>
                </div>
              </div>
            </div>

            <div className="hero-card hero-card-side">
              <div className="h-full w-full rounded-xl border border-cyan-300/20 bg-slate-950/70 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                  Método de pago
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  Tarjeta de crédito o débito
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Cobro con Stripe Checkout y comprobante en PDF al instante.
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-cyan-100">
                  <CreditCard className="h-4 w-4 text-cyan-300" />
                  Pago seguro con Stripe
                </div>
              </div>
            </div>
          </div>

          {/* Así funciona: loop del recibo (sustituye al video del hero) */}
          <div
            id="como-funciona"
            ref={panelRef}
            className="scroll-mt-24 rounded-2xl border border-cyan-500/20 bg-card/40 p-6 backdrop-blur-sm tilt-panel"
          >
            <h3 className="text-2xl font-semibold text-foreground">Así funciona</h3>
            <p className="mt-2 text-muted-foreground">
              Tómale foto a tu recibo, revisa lo que capturamos y págalo sin salir de la app.
            </p>
            <ReceiptLoop className="mt-4" />
          </div>
        </div>
      </div>
    </section>
  )
}
