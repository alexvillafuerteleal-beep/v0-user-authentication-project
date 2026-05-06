import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Lock, TrendingUp, CheckCircle, Sparkles, Cpu } from "lucide-react"
import { HeroSection } from "@/components/hero/HeroSection"

const providers = [
  {
    name: "CFE",
    service: "Electricidad",
    image: "/providers/cfe.svg",
    miniImage: "/providers/mini/cfe-mini.svg",
    tag: "Energia",
    tone: "brand-cfe",
  },
  {
    name: "CONAGUA",
    service: "Agua Potable",
    image: "/providers/conagua.svg",
    miniImage: "/providers/mini/conagua-mini.svg",
    tag: "Agua",
    tone: "brand-conagua",
  },
  {
    name: "PEMEX GAS",
    service: "Gas Natural",
    image: "/providers/pemex.svg",
    miniImage: "/providers/mini/pemex-mini.svg",
    tag: "Gas",
    tone: "brand-pemex",
  },
  {
    name: "TELMEX",
    service: "Internet y Telefonia",
    image: "/providers/telmex.svg",
    miniImage: "/providers/mini/telmex-mini.svg",
    tag: "Internet",
    tone: "brand-telmex",
  },
]

export default function HomePage() {
  return (
    <div className="landing-3d min-h-screen">
      <div className="landing-atmosphere" aria-hidden="true" />
      {/* Navigation */}
      <nav className="landing-nav sticky top-0 z-50 flex items-center justify-between px-6 py-4 md:px-8">
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
          <div className="hidden lg:flex items-center gap-3">
            <Link href="#medios" className="menu-pill text-foreground">
              Medios de Pago
            </Link>
            <Link href="#caracteristicas" className="menu-pill text-muted-foreground">
              Características
            </Link>
            <Link href="#servicios" className="menu-pill text-muted-foreground">
              Servicios
            </Link>
            <Link href="#panel" className="menu-pill text-muted-foreground">
              Vista 3D
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
      <HeroSection />

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
                className="p-6 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-card to-card/50 hover:border-cyan-500/50 hover:from-cyan-500/10 transition-all group tilt-panel"
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

      {/* Vista de Panel */}
      <section id="panel" className="px-6 md:px-8 py-20 border-t border-cyan-500/20">
        <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="screenshot-shell">
            <div className="screenshot-grid" />
            <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-cyan-300/25">
              <Image
                src="/PAGO_IA.png"
                alt="Captura de pantalla real del panel PagoIA"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
            </div>
            <div className="floating-logo-badge badge-cfe">
              <Image src="/providers/cfe.svg" alt="Logo CFE" width={58} height={32} className="h-auto w-12" />
              <span>CFE</span>
            </div>
            <div className="floating-logo-badge badge-conagua">
              <Image src="/providers/conagua.svg" alt="Logo CONAGUA" width={58} height={32} className="h-auto w-12" />
              <span>CONAGUA</span>
            </div>
            <div className="floating-logo-badge badge-pemex">
              <Image src="/providers/pemex.svg" alt="Logo PEMEX" width={58} height={32} className="h-auto w-12" />
              <span>PEMEX</span>
            </div>
            <div className="floating-logo-badge badge-telmex">
              <Image src="/providers/telmex.svg" alt="Logo TELMEX" width={58} height={32} className="h-auto w-12" />
              <span>TELMEX</span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Captura operativa</p>
            <h3 className="text-3xl font-bold text-foreground">Visualizacion del sistema en vivo</h3>
            <p className="text-muted-foreground">
              La experiencia integra pagos, estados y notificaciones en una sola vista. Los logos de los proveedores se muestran de forma directa para que el usuario identifique su servicio sin friccion.
            </p>
            <div className="space-y-3 text-sm text-slate-200">
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-cyan-400" />Vista optimizada para escritorio y celular</div>
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-cyan-400" />Animaciones fluidas sin afectar rendimiento</div>
              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-cyan-400" />Jerarquia visual clara para conversion</div>
            </div>
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
                className={`provider-card ${provider.tone} p-4 rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-900/30 hover:border-cyan-500/40 transition-all group cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="provider-logo-chip">Proveedor Oficial</div>
                  <div className="provider-tone-chip">{provider.tag}</div>
                </div>
                <div className="provider-media relative mb-4 h-36 w-full overflow-hidden rounded-lg border border-cyan-500/20 bg-slate-950/60">
                  <div className="provider-mini-logo md:hidden" aria-hidden="true">
                    <Image
                      src={provider.miniImage}
                      alt=""
                      width={28}
                      height={28}
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                  <Image
                    src={provider.image}
                    alt={`${provider.name} ${provider.service}`}
                    fill
                    className="provider-logo-art object-contain p-3"
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

      <div className="mobile-nav fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-400/30 bg-slate-950/90 p-2 backdrop-blur lg:hidden">
        <Link href="#medios" className="mobile-nav-item">Medios</Link>
        <Link href="#caracteristicas" className="mobile-nav-item">IA</Link>
        <Link href="#servicios" className="mobile-nav-item">Servicios</Link>
      </div>
    </div>
  )
}
