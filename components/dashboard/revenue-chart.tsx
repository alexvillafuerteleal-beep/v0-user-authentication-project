"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { month: "Ene", revenue: 1800, expenses: 1200 },
  { month: "Feb", revenue: 2200, expenses: 1800 },
  { month: "Mar", revenue: 1600, expenses: 1400 },
  { month: "Abr", revenue: 2400, expenses: 2000 },
  { month: "May", revenue: 1400, expenses: 1000 },
  { month: "Jun", revenue: 2000, expenses: 1600 },
  { month: "Jul", revenue: 1200, expenses: 800 },
  { month: "Ago", revenue: 1800, expenses: 1400 },
  { month: "Sep", revenue: 2200, expenses: 1800 },
]

export function RevenueChart() {
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
          tickFormatter={(value) => `${value / 1000}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0d2137",
            border: "1px solid #1e4976",
            borderRadius: "8px",
            color: "#ffffff",
          }}
          labelStyle={{ color: "#8b9bb4" }}
        />
        <Bar 
          dataKey="revenue" 
          fill="#5d87ff" 
          radius={[4, 4, 0, 0]} 
          name="Ingresos"
        />
        <Bar 
          dataKey="expenses" 
          fill="#f76f8e" 
          radius={[4, 4, 0, 0]} 
          name="Gastos"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
