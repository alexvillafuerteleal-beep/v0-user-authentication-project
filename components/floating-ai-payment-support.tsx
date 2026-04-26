"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Minimize2, Loader2, Sparkles } from "lucide-react"

interface MessageAction {
  type: string
  url?: string
  label?: string
}

interface Message {
  id: string
  text: string
  isBot: boolean
  timestamp: Date
  action?: MessageAction
}

const quickPrompts = [
  "Quiero pagar un servicio ahora",
  "Muestrame mis transacciones",
  "Ver alertas y notificaciones",
  "Necesito ayuda con un pago rechazado",
]

export function FloatingAIPaymentSupport() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "¡Hola! 👋 Soy tu asistente de IA. ¿En qué puedo ayudarte con tus pagos?",
      isBot: true,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const executeAction = (action?: MessageAction) => {
    if (!action) return
    if (action.type === "navigate" && action.url) {
      router.push(action.url)
      setIsOpen(false)
      setIsMinimized(false)
    }
  }

  const sendMessage = async (manualText?: string) => {
    const textToSend = (manualText ?? inputValue).trim()
    if (!textToSend) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isBot: false,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    if (!manualText) {
      setInputValue("")
    }
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
        }),
      })

      if (!response.ok) throw new Error("Error en IA")

      const data = await response.json()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || "No entendí tu pregunta. ¿Puedes ser más específico?",
        isBot: true,
        timestamp: new Date(),
        action: data.action || undefined,
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error en chat:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "❌ Error al conectar. Intenta nuevamente o contacta soporte@pagoIA.com",
        isBot: true,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      sendMessage()
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return
    void sendMessage(prompt)
  }

  // Botón cerrado - FUTURISTA
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <style>{`
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(59, 130, 246, 0.3); }
            50% { box-shadow: 0 0 30px rgba(6, 182, 212, 0.8), 0 0 60px rgba(59, 130, 246, 0.5); }
          }
          @keyframes float-bot {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          .bot-float {
            animation: float-bot 3s ease-in-out infinite;
          }
          .bot-glow {
            animation: pulse-glow 2s ease-in-out infinite;
          }
        `}</style>
        <button
          onClick={() => setIsOpen(true)}
          className="bot-float bot-glow relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 text-white shadow-2xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center group border border-cyan-300/50 backdrop-blur-sm"
          title="Chat de soporte con IA"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl"></div>
          <MessageCircle className="w-7 h-7 relative z-10" />
          <Sparkles className="w-4 h-4 absolute top-0 right-0 text-yellow-300 animate-spin" />
        </button>
      </div>
    )
  }

  // Minimizado - FUTURISTA
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white px-4 py-2 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 font-semibold tracking-wide border border-cyan-300/50 backdrop-blur-sm hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>Chat IA</span>
        </button>
      </div>
    )
  }

  // Chat abierto - ULTRA FUTURISTA
  return (
    <div className="fixed bottom-6 right-6 z-40 w-full max-w-sm">
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .gradient-animated {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-in { animation: slide-in 0.3s ease-out; }
        @keyframes message-pop {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .message-pop { animation: message-pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
      
      <Card className="slide-in flex flex-col h-[580px] shadow-2xl border border-cyan-400/30 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900/95 via-blue-900/50 to-slate-900/95 backdrop-blur-xl">
        
        {/* Header - FUTURISTA */}
        <CardHeader className="pb-3 px-5 py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white flex flex-row items-center justify-between border-b border-cyan-400/30 gradient-animated">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-lg"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse relative z-10" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wider uppercase">Asistente de Pagos IA</h3>
              <p className="text-xs opacity-80 font-light">Disponible 24/7</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg transition-all hover:scale-110"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg transition-all hover:scale-110"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages Area - FUTURISTA */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-900/30 to-blue-900/20">
          {/* Grid de fondo animado */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex message-pop ${msg.isBot ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-xs px-4 py-2.5 rounded-xl text-sm leading-relaxed font-medium transition-all hover:shadow-lg ${
                  msg.isBot
                    ? "bg-gradient-to-br from-blue-600/40 to-purple-600/30 text-blue-50 border border-blue-400/50 rounded-bl-sm backdrop-blur-sm"
                    : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-sm shadow-lg"
                }`}
              >
                <p className="whitespace-pre-wrap break-words font-sans">{msg.text}</p>
                <span className="text-xs opacity-70 mt-1.5 block font-light">
                  {msg.timestamp.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {msg.isBot && msg.action?.label && msg.action?.url && (
                  <Button
                    size="sm"
                    className="mt-2 h-7 text-xs bg-cyan-500/90 hover:bg-cyan-500 text-white"
                    onClick={() => executeAction(msg.action)}
                  >
                    {msg.action.label}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start message-pop">
              <div className="bg-gradient-to-br from-blue-600/40 to-purple-600/30 border border-blue-400/50 px-4 py-2.5 rounded-xl rounded-bl-sm flex items-center gap-3 backdrop-blur-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                <span className="text-xs text-blue-100 font-medium">Analizando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {messages.length <= 2 && (
            <div className="pt-2 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="text-xs px-2.5 py-1 rounded-full border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/20 transition-colors"
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </CardContent>

        {/* Input Area - FUTURISTA */}
        <div className="border-t border-cyan-400/30 p-4 bg-gradient-to-t from-slate-900/50 to-blue-900/20 backdrop-blur-md">
          <div className="flex gap-2">
            <div className="flex-1 relative group">
              <Input
                placeholder="Pregunta sobre pagos..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                className="text-sm h-10 rounded-lg border-cyan-400/50 bg-slate-800/50 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-500/50 transition-all font-medium"
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 pointer-events-none transition-all"></div>
            </div>
            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white h-10 px-4 rounded-lg font-semibold transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-300/50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center font-light tracking-wide">
            🔮 Tecnología IA • Respuestas Instantáneas
          </p>
        </div>
      </Card>
    </div>
  )
}
