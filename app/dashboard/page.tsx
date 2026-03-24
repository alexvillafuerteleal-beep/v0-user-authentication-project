import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { Users, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Forecast Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Pronóstico de Ingresos</CardTitle>
            <Select defaultValue="week">
              <SelectTrigger className="w-32 bg-secondary border-border text-foreground">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="year">Este Año</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="space-y-6">
          {/* New Customers Card */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">Nuevos Clientes</h3>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Nuevas metas</span>
                  <span className="text-sm font-medium text-foreground">83%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "83%" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Income Card */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">Ingresos Totales</h3>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">$680</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                      +18%
                    </span>
                  </div>
                </div>
                <div className="h-16 w-24">
                  <svg viewBox="0 0 100 40" className="w-full h-full">
                    <path
                      d="M0,30 Q20,35 30,25 T50,20 T70,30 T100,15"
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Usuarios Activos", value: "12,456", change: "+12%", icon: Users },
          { title: "Ventas Totales", value: "$45,678", change: "+8%", icon: DollarSign },
          { title: "Tasa de Conversión", value: "3.24%", change: "+2%", icon: TrendingUp },
          { title: "Ingresos Mensuales", value: "$89,012", change: "+15%", icon: ArrowUpRight },
        ].map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
