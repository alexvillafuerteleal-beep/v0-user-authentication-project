"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export function PendingPayments() {
  return (
    <Card className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-foreground">Pagos Inmediatos ✓</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
          <p className="text-foreground font-semibold">Todos tus pagos son en tiempo real</p>
          <p className="text-sm text-muted-foreground mt-2">
            Con tarjeta de crédito/débito, tus pagos se confirman al instante. No hay pagos pendientes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
