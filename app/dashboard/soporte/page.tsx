"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { MessageSquare, Mail, Phone, Send, MessageCircle, CheckCircle2, Loader2, Bot, X, Sparkles, ArrowRight } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

type ActionType = { type: string; url?: string; label?: string }
type ChatMessage = { role: string; text: string; action?: ActionType }

const QUICK_ACTIONS = [
  { label: "Ver mi historial", icon: "📋" },
  { label: "Ir a servicios", icon: "⚡" },
  { label: "Descargar factura", icon: "📄" },
  { label: "Cómo pagar", icon: "💳" },
  { label: "Ver comparativo", icon: "📊" },
  { label: "Seguridad", icon: "🔐" },
]

export default function SoportePage() {
  const router = useRouter()
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formMessage, setFormMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "support", text: "¡Hola! 👋 Soy el asistente IA de PagoIA. Puedo responder tus preguntas **y llevarte directamente** a cualquier sección del sistema.\n\n¿En qué te puedo ayudar hoy?" }
  ])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formName && formEmail && formMessage) {
      setSubmitted(true)
      setFormName("")
      setFormEmail("")
      setFormMessage("")
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    setShowQuickActions(false)
    setChatInput("")
    setChatMessages(prev => [...prev, { role: "user", text }])
    setChatLoading(true)

    try {
      const response = await fetch("/api/ai-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: chatMessages })
      })

      const data = await response.json()

      setChatMessages(prev => [...prev, {
        role: "support",
        // Fix: API returns `response`, not `text`
        text: data.response || data.error || "Disculpa, hubo un error procesando tu pregunta.",
        action: data.action || undefined
      }])
    } catch {
      setChatMessages(prev => [...prev, {
        role: "support",
        text: "Discúlpame, tuve un error de conexión. Intenta de nuevo en un momento."
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleChatSend = () => sendMessage(chatInput)

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleChatSend()
    }
  }

  const handleAction = (action: ActionType) => {
    if (action.type === "navigate" && action.url) {
      setChatOpen(false)
      router.push(action.url)
    }
  }

  const faqItems = [
    {
      question: "¿Cómo agrego un nuevo servicio?",
      answer: "Ve a 'Mis Servicios' en el dashboard y haz clic en '+ Agregar Servicio'. Completa los datos (nombre, empresa, monto, fecha de vencimiento) y haz clic en Agregar."
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos tarjeta de crédito y débito (Visa, MasterCard) con confirmación inmediata. Todos los pagos se procesan en tiempo real a través de Stripe con encriptación bancaria."
    },
    {
      question: "¿Es segura mi información?",
      answer: "Sí. Utilizamos encriptación SSL/TLS, cumplimos con PCI-DSS y los datos de tu tarjeta nunca se almacenan — van directo a Stripe, procesador certificado a nivel bancario."
    },
    {
      question: "¿Cómo descargo mis comprobantes?",
      answer: "Ve a 'Estados de Cuenta' en el menú. Cada factura tiene un botón 'PDF' para descargar individualmente. También puedes exportar todas en CSV con el botón 'Exportar Todo'."
    },
    {
      question: "¿Cómo funcionan las notificaciones?",
      answer: "Recibirás alertas por email y push según tu configuración. Ve a 'Configuración' → Notificaciones para activar o desactivar cada tipo."
    },
    {
      question: "¿Qué es el Análisis Comparativo?",
      answer: "El Comparativo muestra la variación de tus gastos mes a mes por servicio. Está disponible en el menú lateral y puedes exportarlo en PDF o CSV."
    }
  ]

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Centro de Soporte</h1>
        <p className="text-muted-foreground">¿Necesitas ayuda? Estamos aquí para ti</p>
      </div>

      {/* Contact Methods Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: MessageCircle, title: "Chat IA", desc: "Disponible 24/7", action: () => setChatOpen(true), highlight: true },
          { icon: Mail, title: "Email", desc: "soporte@pagoIA.com", action: () => window.location.href = "mailto:soporte@pagoIA.com", highlight: false },
          { icon: Phone, title: "Teléfono", desc: "+52 55 1234-5678", action: () => window.location.href = "tel:+525512345678", highlight: false }
        ].map((contact, idx) => (
          <Card
            key={idx}
            className={`hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg group ${contact.highlight ? "border-primary/40 bg-primary/5" : ""}`}
            onClick={contact.action}
          >
            <CardContent className="text-center p-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110 ${contact.highlight ? "bg-primary/20" : "bg-primary/10"}`}>
                <contact.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{contact.title}</h3>
              <p className="text-sm text-muted-foreground">{contact.desc}</p>
              {contact.highlight && (
                <span className="inline-block mt-2 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">Recomendado</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Contact Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Contáctanos</CardTitle>
            <CardDescription>Completa el formulario y te respondemos en 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">¡Mensaje enviado exitosamente!</span>
              </div>
            )}
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-foreground text-sm">Nombre</Label>
                <Input id="name" placeholder="Tu nombre" value={formName} onChange={(e) => setFormName(e.target.value)} className="border-border bg-secondary/50 mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
                <Input id="email" type="email" placeholder="tu@email.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="border-border bg-secondary/50 mt-1.5" />
              </div>
              <div>
                <Label htmlFor="message" className="text-foreground text-sm">Mensaje</Label>
                <Textarea id="message" placeholder="¿En qué podemos ayudarte?" value={formMessage} onChange={(e) => setFormMessage(e.target.value)} rows={4} className="border-border bg-secondary/50 mt-1.5" />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white gap-2" disabled={!formName || !formEmail || !formMessage}>
                <Mail className="w-4 h-4" />
                Enviar Mensaje
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Preguntas Frecuentes</CardTitle>
            <CardDescription>Respuestas a las preguntas más comunes</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-1">
              {faqItems.slice(0, 4).map((item, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`} className="border-border">
                  <AccordionTrigger className="text-foreground hover:text-primary text-sm text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <Button
              variant="outline"
              className="w-full mt-4 border-border text-foreground hover:bg-secondary gap-2 text-sm"
              onClick={() => document.getElementById("all-faq")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver todas las preguntas
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* All FAQs */}
      <Card className="bg-card border-border" id="all-faq">
        <CardHeader>
          <CardTitle className="text-foreground">Todas las Preguntas Frecuentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-1">
            {faqItems.map((item, idx) => (
              <AccordionItem key={idx} value={`all-faq-${idx}`} className="border-border">
                <AccordionTrigger className="text-foreground hover:text-primary text-sm text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* ── CHAT WIDGET ── */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-[360px] sm:w-[420px] h-[560px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">Asistente IA PagoIA</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-white/80 text-xs">En línea · 24/7</p>
                </div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.role !== "user" && (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div className="max-w-[78%] space-y-2">
                  <div className={`px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm shadow-sm"
                  }`}>
                    {msg.text}
                  </div>
                  {/* Action Button */}
                  {msg.action && msg.action.url && (
                    <Button
                      size="sm"
                      onClick={() => handleAction(msg.action!)}
                      className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs gap-1.5 h-8 rounded-xl"
                      variant="outline"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      {msg.action.label}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-card border border-border px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {showQuickActions && chatMessages.length <= 1 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-muted-foreground font-medium px-1">Acciones rápidas:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_ACTIONS.map((qa, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(qa.label)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-left transition-all text-xs text-foreground font-medium"
                    >
                      <span>{qa.icon}</span>
                      <span className="truncate">{qa.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2 bg-card shrink-0">
            <Input
              placeholder="Escribe tu pregunta..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyPress}
              disabled={chatLoading}
              className="border-border bg-secondary/50 text-sm rounded-xl disabled:opacity-50 focus-visible:ring-primary/50"
            />
            <Button
              size="icon"
              onClick={handleChatSend}
              disabled={chatLoading || !chatInput.trim()}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl shrink-0"
            >
              {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 group flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-full shadow-lg z-40 transition-all hover:shadow-primary/30 hover:shadow-xl"
          title="Abrir asistente IA"
        >
          <Bot className="w-5 h-5" />
          <span className="text-sm font-medium max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap">Asistente IA</span>
        </button>
      )}
    </div>
  )
}
