"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { createClient } from "@/lib/supabase/client"

interface ChartData {
  month: string
  expenses: number
}

export function RevenueChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransactionData()
  }, [])

  const loadTransactionData = async () => {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Obtener transacciones del usuario
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, transaction_date, status")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("transaction_date", { ascending: true })

      if (error) throw error

      // Agrupar por mes
      const monthlyData: Record<string, number> = {}
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

      transactions?.forEach((tx: { amount: number; transaction_date: string; status: string }) => {
        const date = new Date(tx.transaction_date)
        const monthKey = monthNames[date.getMonth()]
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (tx.amount || 0)
      })

      // Crear datos para los últimos 9 meses
      const now = new Date()
      const chartData: ChartData[] = []
      
      for (let i = 8; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const month = monthNames[d.getMonth()]
        chartData.push({
          month,
          expenses: monthlyData[month] || 0,
        })
      }

      setData(chartData)
    } catch (error) {
      console.error("[RevenueChart] Error loading data:", error)
      // Mostrar datos vacíos si hay error
      setData([
        { month: "Ene", expenses: 0 },
        { month: "Feb", expenses: 0 },
        { month: "Mar", expenses: 0 },
        { month: "Abr", expenses: 0 },
        { month: "May", expenses: 0 },
        { month: "Jun", expenses: 0 },
        { month: "Jul", expenses: 0 },
        { month: "Ago", expenses: 0 },
        { month: "Sep", expenses: 0 },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barGap={8}>
        <XAxis 
          dataKey="month" 
          stroke="#8b9bb4" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
        />
        <YAxis 
          stroke="#8b9bb4" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0d2137",
            border: "1px solid #1e4976",
            borderRadius: "8px",
            color: "#ffffff",
          }}
          labelStyle={{ color: "#8b9bb4" }}
          formatter={(value) => `$${(value as number).toFixed(2)} MXN`}
        />
        <Bar 
          dataKey="expenses" 
          fill="#5d87ff" 
          radius={[4, 4, 0, 0]} 
          name="Gastos Reales"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
