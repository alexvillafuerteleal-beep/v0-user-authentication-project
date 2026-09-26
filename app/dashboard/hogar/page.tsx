import { HouseholdPanel } from "@/components/household/household-panel"

export const metadata = { title: "Hogar · PagoIA" }

export default function HogarPage() {
  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">Hogar compartido</h1>
        <p className="mt-1 text-muted-foreground">Divide los recibos con quienes vives y lleva la cuenta de quién le debe a quién.</p>
      </div>
      <HouseholdPanel />
    </div>
  )
}
