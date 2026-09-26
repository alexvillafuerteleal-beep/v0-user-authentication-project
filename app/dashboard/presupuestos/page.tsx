import { BudgetCards } from "@/components/budgets/budget-cards"

export const metadata = { title: "Presupuestos · PagoIA" }

export default function PresupuestosPage() {
  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">Presupuestos</h1>
        <p className="mt-1 text-muted-foreground">Ponle un límite mensual a cada servicio y te avisamos antes de pasarte.</p>
      </div>
      <BudgetCards />
    </div>
  )
}
