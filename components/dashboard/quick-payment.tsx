"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Droplets, Wifi, Wind, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const quickPayOptions = [
  {
    id: "electricity",
    name: "Electricidad",
    provider: "CFE",
    icon: Zap,
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-200 dark:border-yellow-500/30",
    amount: 1150.0,
    currency: "MXN",
  },
  {
    id: "water",
    name: "Agua",
    provider: "CONAGUA",
    icon: Droplets,
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-500/30",
    amount: 572.5,
    currency: "MXN",
  },
  {
    id: "internet",
    name: "Internet",
    provider: "TELMEX",
    icon: Wifi,
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-500/30",
    amount: 1031.0,
    currency: "MXN",
  },
  {
    id: "gas",
    name: "Gas",
    provider: "PEMEX",
    icon: Wind,
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-500/30",
    amount: 803.5,
    currency: "MXN",
  },
]

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
)

export function QuickPayment() {
  const [processingService, setProcessingService] = useState<string | null>(null)
  const { toast } = useToast()

  // Función auxiliar para extraer mensajes de error
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === "object" && error !== null) {
      const err = error as Record<string, unknown>
      if ("message" in err && typeof err.message === "string") {
        return err.message
      }
      if ("error_description" in err && typeof err.error_description === "string") {
        return err.error_description
      }
      if ("details" in err && typeof err.details === "string") {
        return err.details
      }
      return JSON.stringify(err)
    }
    return String(error) || "Error desconocido"
  }

  const handleQuickPay = async (service: string) => {
    const option = quickPayOptions.find((o) => o.id === service)
    if (!option) return

    try {
      setProcessingService(service)

      // Crear sesión de pago en Stripe
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: option.amount,
          service: option.name,
          serviceId: option.id,
          provider: option.provider,
          serviceType: option.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create checkout session")
      }

      const { sessionId, url } = await response.json()

      // Redirigir a Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error("No checkout URL provided")
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      console.error("Payment error:", errorMessage)
      toast({
        title: "Error en el pago",
        description: errorMessage,
        variant: "destructive",
      })
      setProcessingService(null)
    }
  }

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="text-foreground">Pagos Rápidos</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Con Stripe 💳</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickPayOptions.map((option) => {
            const Icon = option.icon
            const isProcessing = processingService === option.id
            return (
              <Button
                key={option.id}
                onClick={() => handleQuickPay(option.id)}
                disabled={isProcessing}
                variant="outline"
                className={`h-auto py-4 flex flex-col gap-2 items-center justify-center ${option.bgColor} border-2 ${option.borderColor} hover:border-opacity-100 transition-all group disabled:opacity-75`}
                title={`$${option.amount.toFixed(2)} ${option.currency || "MXN"}`}
              >
                <div className={`${option.textColor} group-hover:scale-110 transition-transform ${isProcessing ? "animate-spin" : ""}`}>
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <span className={`text-xs font-semibold ${option.textColor}`}>
                  {option.name}
                </span>
                <span className={`text-xs ${option.textColor} opacity-75`}>
                  ${option.amount.toFixed(0)} MXN
                </span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
