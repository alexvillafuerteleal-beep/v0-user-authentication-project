import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Lock, TrendingUp, CheckCircle, Sparkles, ShieldCheck, Cpu } from "lucide-react"

const providers = [
  {
    name: "CFE",
    service: "Electricidad",
    image: "/providers/cfe.svg",
  },
  {
    name: "CONAGUA",
    service: "Agua Potable",
    image: "/providers/conagua.svg",
  },
  {
    name: "PEMEX GAS",
    service: "Gas Natural",
    image: "/providers/pemex.svg",
  },
  {
    name: "TELMEX",
    service: "Internet y Telefonia",
    image: "/providers/telmex.svg",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-black">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-border/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-all duration-300">
            <svg viewBox="0 0 64 64" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="sphereGradientNav" cx="35%" cy="35%">
                  <stop offset="0%" stopColor="#00D9FF" />
                  <stop offset="70%" stopColor="#00A8FF" />
                  <stop offset="100%" stopColor="#0066FF" />
                </radialGradient>
                <filter id="neonGlowNav" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="32" cy="32" r="28" fill="url(#sphereGradientNav)" opacity="0.12" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="url(#sphereGradientNav)" strokeWidth="1" opacity="0.25" />
              <text x="32" y="38" fontSize="18" fontWeight="bold" textAnchor="middle" fill="#00D9FF" opacity="0.9" filter="url(#neonGlowNav)" fontFamily="system-ui">Pg</text>
            </svg>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">PagoIA</span>
          </Link>
          <div className="hidden lg:flex items-center gap-8">
            <Link href="#medios" className="text-foreground hover:text-cyan-400 transition-colors text-sm font-medium">
              Medios de Pago
            </Link>
            <Link href="#caracteristicas" className="text-muted-foreground hover:text-cyan-400 transition-colors text-sm font-medium">
              Características
            </Link>
            <Link href="#servicios" className="text-muted-foreground hover:text-cyan-400 transition-colors text-sm font-medium">
              Servicios
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-foreground hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg">
            <Link href="/auth/login">Ingresar</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg px-6 font-semibold">
            <Link href="/auth/register">Comenzar</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 md:px-8 py-20 md:py-40 overflow-hidden">
        {/* Gradient backgrounds */}
        <div className="absolute top-40 right-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              Gestion de Pagos
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                Tenemos Todo
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
              Maximiza tu control, minimiza tus costos y optimiza tus pagos con inteligencia artificial
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg px-8 font-semibold text-base h-12">
                <Link href="/auth/register">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-lg px-8 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-semibold text-base h-12">
                <Link href="#caracteristicas">Explorar</Link>
              </Button>
            </div>
          </div>

          <div id="medios" className="mt-20 grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
            <div className="hero-3d-scene">
              <div className="hero-orb" />
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
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/90">Control total</p>
                    <p className="mt-1 text-lg font-semibold text-white">Pagos en tiempo real con analitica inteligente</p>
                  </div>
                </div>
              </div>
              <div className="hero-card hero-card-side">
                <div className="h-full w-full rounded-xl border border-cyan-300/20 bg-slate-950/70 p-5 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Metodo principal</p>
                  <p className="mt-2 text-xl font-semibold text-white">Tarjeta credito o debito</p>
                  <p className="mt-2 text-sm text-slate-300">Procesamiento inmediato con confirmacion segura y recibo digital.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-card/40 p-6 backdrop-blur-sm">
              <h3 className="text-2xl font-semibold text-foreground">Alta de usuarios lista</h3>
              <p className="mt-3 text-muted-foreground">
                Registro por correo y acceso con Google activos. Flujo de autenticacion preparado para dominio propio.
              </p>
              <div className="mt-6 space-y-3 text-sm text-slate-200">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-400" />Confirmacion de sesion y rutas protegidas</div>
                <div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-cyan-400" />Checkout de Stripe adaptable a cualquier host</div>
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-400" />Experiencia visual optimizada para publico final</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Características Section */}
      <section id="caracteristicas" className="px-6 md:px-8 py-20 border-t border-cyan-500/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Potencia tu Gestión Financiera
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Suite completa de herramientas para optimizar y automatizar tus pagos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Análisis Inteligente",
                description: "Recibe insights de IA sobre tus gastos y predicciones precisas para optimizar tu presupuesto."
              },
              {
                icon: Lock,
                title: "Seguridad Bancaria",
                description: "Encriptación de nivel empresarial protege todos tus datos financieros y personales."
              },
              {
                icon: CheckCircle,
                title: "Automatización Total",
                description: "Programa pagos recurrentes, recibe recordatorios y evita pagos atrasados automáticamente."
              },
              {
                icon: BarChart3,
                title: "Reportes Detallados",
                description: "Exporta análisis completos en PDF y Excel para auditorías y seguimiento financiero."
              },
              {
                icon: Sparkles,
                title: "Integración Multi-Servicio",
                description: "Conecta todos tus servicios: agua, luz, gas, internet, telefonia y mas en un solo panel."
              },
              {
                icon: Cpu,
                title: "Soporte 24/7 con IA",
                description: "Chat inteligente disponible todo el tiempo para resolver tus dudas al instante."
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="p-6 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-card to-card/50 hover:border-cyan-500/50 hover:from-cyan-500/10 transition-all group"
              >
                <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios Section */}
      <section id="servicios" className="px-6 md:px-8 py-20 border-t border-cyan-500/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Servicios Mexicanos Principales
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Gestiona fácilmente tus pagos a los principales proveedores de servicios en México
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {providers.map((provider, i) => (
              <div 
                key={i}
                className="provider-card p-4 rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-900/30 hover:border-cyan-500/40 transition-all group cursor-pointer"
              >
                <div className="relative mb-4 h-36 w-full overflow-hidden rounded-lg border border-cyan-500/20">
                  <Image
                    src={provider.image}
                    alt={`${provider.name} ${provider.service}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">{provider.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{provider.service}</p>
                <Button asChild size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/30 h-8 text-xs">
                  <Link href="/auth/register">Comenzar</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-8 py-20 border-t border-cyan-500/20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            ¿Listo para optimizar tus pagos?
          </h2>
          <p className="text-xl text-muted-foreground">
            Únete a miles de usuarios que ya confían en PagoIA para gestionar sus servicios
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg px-8 font-semibold text-base h-12">
              <Link href="/auth/register">
                Registrarme Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-lg px-8 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-semibold text-base h-12">
              <Link href="/auth/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan-500/20 px-6 md:px-8 py-12 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="sphereGradientFooter" cx="35%" cy="35%">
                      <stop offset="0%" stopColor="#00D9FF" />
                      <stop offset="100%" stopColor="#0066FF" />
                    </radialGradient>
                  </defs>
                  <circle cx="32" cy="32" r="28" fill="url(#sphereGradientFooter)" opacity="0.15" />
                  <text x="32" y="38" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#00D9FF" fontFamily="system-ui">Pg</text>
                </svg>
                <span className="font-bold text-cyan-400">PagoIA</span>
              </div>
              <p className="text-sm text-muted-foreground">Gestión inteligente de pagos con IA</p>
            </div>
          </div>
          <div className="border-t border-cyan-500/10 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 PagoIA. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
