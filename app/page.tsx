import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, BarChart3, Globe } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">Cr</span>
            </div>
            <span className="text-xl font-bold text-foreground">Crypto</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Exchange
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Características
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Contacto
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
            <Link href="/auth/login">Iniciar Sesión</Link>
          </Button>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6">
            <Link href="/auth/register">Registrarse</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight text-balance">
              Compra, Vende y Acepta{" "}
              <span className="text-accent">Criptomonedas</span>{" "}
              con Facilidad
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Una plataforma rápida, segura y fácil de usar para intercambiar Bitcoin, 
              Ethereum y otros activos digitales. Únete a millones que abrazan el 
              futuro de las finanzas.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8">
                <Link href="/auth/register">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-border text-foreground hover:bg-secondary">
                <Link href="#features">Saber Más</Link>
              </Button>
            </div>
          </div>
          
          {/* Phone mockup placeholder */}
          <div className="relative flex justify-center">
            <div className="w-72 h-[500px] bg-card rounded-3xl border border-border shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">9:41</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-2 bg-muted-foreground rounded-sm" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold text-foreground">38 500.00</p>
                <div className="mt-4 h-32 bg-secondary/50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-16 h-16 text-primary/50" />
                </div>
                <div className="mt-4 space-y-3">
                  {["Bitcoin (BTC)", "Ethereum (ETH)", "Tether (USDT)"].map((coin, i) => (
                    <div key={coin} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="text-xs text-accent">{i + 1}</span>
                        </div>
                        <span className="text-sm text-foreground">{coin}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-primary text-xs">
                        Comprar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-primary/30 rounded-lg rotate-12" />
            <div className="absolute top-10 -right-5 w-16 h-16 bg-accent/30 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            ¿Por qué elegirnos?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Ofrecemos las mejores herramientas y características para que tu experiencia 
            con criptomonedas sea segura y eficiente.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Seguridad Avanzada",
                description: "Protección de nivel bancario para tus activos digitales"
              },
              {
                icon: Zap,
                title: "Transacciones Rápidas",
                description: "Ejecuta operaciones en milisegundos con nuestra tecnología"
              },
              {
                icon: BarChart3,
                title: "Análisis en Tiempo Real",
                description: "Gráficos y métricas actualizadas al instante"
              },
              {
                icon: Globe,
                title: "Acceso Global",
                description: "Opera desde cualquier lugar del mundo, 24/7"
              }
            ].map((feature) => (
              <div 
                key={feature.title}
                className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Comienza tu viaje cripto hoy
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Regístrate en minutos y obtén acceso a todas nuestras herramientas de trading.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-10">
            <Link href="/auth/register">
              Descargar Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">Cr</span>
            </div>
            <span className="font-bold text-foreground">Crypto</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Crypto. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
