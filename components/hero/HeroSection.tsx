"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ShieldCheck, Cpu, CreditCard, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHeroAnimation } from "@/hooks/use-hero-animation"

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
            Pago IA para Mexico
          </p>

          <h1
            ref={titleRef}
            className="text-5xl md:text-7xl font-bold text-foreground leading-tight hero-title-3d"
          >
            Gestion de Pagos
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              Tenemos Todo
            </span>
          </h1>

          <p
            ref={subtitleRef}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light"
          >
            Maximiza tu control, minimiza tus costos y optimiza tus pagos con
            inteligencia artificial
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
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-lg px-8 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-semibold text-base h-12"
            >
              <Link href="#caracteristicas">Explorar</Link>
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
                  src="/PAGO_IA.png"
                  alt="Panel de pagos de PagoIA"
                  fill
                  className="object-cover opacity-90"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/90">
                    Control total
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Pagos en tiempo real con analitica inteligente
                  </p>
                </div>
              </div>
            </div>

            <div className="hero-card hero-card-side">
              <div className="h-full w-full rounded-xl border border-cyan-300/20 bg-slate-950/70 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                  Metodo principal
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  Tarjeta credito o debito
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Procesamiento inmediato con confirmacion segura y recibo digital.
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-cyan-100">
                  <CreditCard className="h-4 w-4 text-cyan-300" />
                  100% Stripe Checkout
                </div>
              </div>
            </div>
          </div>

          {/* Panel informativo derecho */}
          <div
            ref={panelRef}
            className="rounded-2xl border border-cyan-500/20 bg-card/40 p-6 backdrop-blur-sm tilt-panel"
          >
            <h3 className="text-2xl font-semibold text-foreground">
              Alta de usuarios lista
            </h3>
            <p className="mt-3 text-muted-foreground">
              Registro por correo y acceso con Google activos. Flujo de
              autenticacion preparado para dominio propio.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                Confirmacion de sesion y rutas protegidas
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                Checkout de Stripe adaptable a cualquier host
              </div>
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-cyan-400" />
                Alertas y recordatorios inteligentes en tiempo real
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
