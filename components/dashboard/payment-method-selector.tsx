"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Zap, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const SERVICES = [
  { id: "electricity", name: "Electricidad", provider: "CFE", emoji: "⚡" },
  { id: "water", name: "Agua", provider: "CONAGUA", emoji: "💧" },
  { id: "gas", name: "Gas", provider: "PEMEX", emoji: "🔥" },
  { id: "internet", name: "Internet", provider: "TELMEX", emoji: "📡" },
]

export function PaymentMethodSelector() {
  const [selectedService, setSelectedService] = useState("cfe")
  const [customAmount, setCustomAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const service = SERVICES.find((s) => s.id === selectedService)
  const amount = customAmount ? parseFloat(customAmount) : 500

  const handlePayment = async () => {
    try {
      if (!selectedService) {
        toast({
          title: "Error",
          description: "Por favor selecciona un servicio",
          variant: "destructive",
        })
        return
      }

      if (customAmount && isNaN(amount)) {
        toast({
          title: "Error",
          description: "El monto debe ser un número válido",
          variant: "destructive",
        })
        return
      }

      setLoading(true)
      console.log(`[PaymentSelector] Creating payment: service=${selectedService}, amount=${amount}`)

      const requestBody = {
        amount: amount,
        service: service?.name || selectedService,
        serviceId: selectedService,
        provider: service?.provider || selectedService.toUpperCase(),
        serviceType: selectedService,
      }
      
      console.log("[PaymentSelector] Request payload:", JSON.stringify(requestBody, null, 2))

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      console.log(`[PaymentSelector] Response status: ${response.status}, statusText: "${response.statusText}"`)

      if (!response.ok) {
        let errorData: Record<string, any> = { error: `HTTP ${response.status}: ${response.statusText}` }
        let responseText = ""

        try {
          responseText = await response.text()
          console.log("[PaymentSelector] Raw response text:", responseText.substring(0, 500))
          
          if (responseText.trim()) {
            try {
              errorData = JSON.parse(responseText)
            } catch (jsonError) {
              console.warn("[PaymentSelector] Could not parse response as JSON:", jsonError)
              errorData = { error: responseText || `HTTP ${response.status}: ${response.statusText}` }
            }
          } else {
            errorData = { error: `HTTP ${response.status}: ${response.statusText} (sin cuerpo de respuesta)` }
          }
        } catch (readError) {
          console.error("[PaymentSelector] Could not read response:", readError)
          errorData = { error: `Error reading response: ${String(readError)}` }
        }

        // Enhanced logging for debugging
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          errorData,
          responseLength: responseText.length,
          timestamp: new Date().toISOString(),
        }
        console.error("[PaymentSelector] Full error details:", errorDetails)

        // Special handling for common errors
        if (response.status === 401) {
          toast({
            title: "Sesión Expirada",
            description: "Por favor inicia sesión nuevamente para continuar",
            variant: "destructive",
          })
          window.location.href = "/auth/login"
          return
        }

        if (response.status === 404) {
          const endpoint = "/api/stripe/create-checkout-session"
          console.error(`[PaymentSelector] Endpoint not found: ${endpoint}`)
          throw new Error(`Endpoint no disponible: ${endpoint} (Error 404). El servidor podría no estar ready.`)
        }

        if (response.status === 500) {
          console.error("[PaymentSelector] Server error - check API logs")
          throw new Error(`Error del servidor (500): ${errorData.error || "Error desconocido"}`)
        }

        const errorMessage = errorData?.error || errorData?.message || `Error ${response.status}: ${response.statusText}`
        console.error("[PaymentSelector] Throwing error with message:", errorMessage)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("[PaymentSelector] Payment created successfully:", data)

      if (data.url) {
        console.log("[PaymentSelector] Redirecting to Stripe checkout:", data.url)
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL provided by Stripe API")
      }
    } catch (error) {
      let errorMsg = "Error desconocido"
      
      if (error instanceof Error) {
        errorMsg = error.message
      } else if (typeof error === "object" && error !== null) {
        errorMsg = JSON.stringify(error)
      } else if (error) {
        errorMsg = String(error)
      }
      
      console.error("[PaymentSelector] Final error message:", errorMsg, "Full error:", error)
      
      toast({
        title: "❌ Error al procesar pago",
        description: errorMsg || "No se pudo procesar el pago. Por favor intenta más tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Realizar Pago Rápido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleccionar Servicio */}
        <div className="space-y-2">
          <Label htmlFor="service-select" className="text-foreground font-semibold">
            Selecciona el Servicio
          </Label>
          <Select value={selectedService} onValueChange={setSelectedService} disabled={loading}>
            <SelectTrigger
              id="service-select"
              className="bg-secondary border-border text-foreground"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {SERVICES.map((svc) => (
                <SelectItem key={svc.id} value={svc.id}>
                  {svc.emoji} {svc.name} — {svc.provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Monto Personalizado */}
        <div className="space-y-2">
          <Label htmlFor="amount-input" className="text-foreground font-semibold">
            Monto (MXN)
          </Label>
          <Input
            id="amount-input"
            type="number"
            placeholder="500"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            disabled={loading}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Monto a pagar: <span className="font-semibold text-foreground">${amount.toFixed(2)} MXN</span>
          </p>
        </div>

        {/* Métodos de Pago - Solo Tarjeta en Tiempo Real */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div className="text-sm">
              <p className="font-semibold text-foreground">Tarjeta de Crédito</p>
              <p className="text-xs text-muted-foreground">Pago en tiempo real - Inmediato ✓</p>
            </div>
          </div>
        </div>

        {/* Botón de Pago */}
        <Button
          onClick={handlePayment}
          disabled={loading || !selectedService}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold h-10 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              💰 Pagar ${amount.toFixed(2)} MXN
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
