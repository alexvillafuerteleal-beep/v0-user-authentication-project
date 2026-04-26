"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getMonthlySpendingSummary } from "@/lib/supabase/services"

interface SpendingData {
  [key: string]: number
}

export function SpendingAnalysis() {
  const [spending, setSpending] = useState<SpendingData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSpending()
  }, [])

  async function loadSpending() {
    setLoading(true)
    const data = await getMonthlySpendingSummary()
    setSpending(data)
    setLoading(false)
  }

  const total = Object.values(spending).reduce((a, b) => a + b, 0)
  const serviceColors: Record<string, string> = {
    electricity: "bg-yellow-500",
    water: "bg-blue-500",
    internet: "bg-purple-500",
    gas: "bg-orange-500",
    other: "bg-gray-500",
  }

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Análisis de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="text-foreground">Análisis de Gastos Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(spending).length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos de gastos</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(spending).map(([service, amount]) => {
              const percentage = total > 0 ? (amount / total) * 100 : 0
              const colorClass = serviceColors[service.toLowerCase()] || serviceColors.other

              return (
                <div key={service}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground capitalize">
                      {service}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        ${amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2 bg-secondary" />
                </div>
              )
            })}
            <div className="pt-4 mt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Total Mensual</span>
                <span className="font-bold text-lg text-primary">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
