import { Suspense } from "react"
import { AutopayPanel } from "@/components/autopay/autopay-panel"

export const metadata = { title: "Pagos automáticos · PagoIA" }

export default function ProgramadosPage() {
  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">Pagos automáticos</h1>
        <p className="mt-1 text-muted-foreground">Guarda una tarjeta y deja que tus recibos se paguen solos antes de vencer, con un tope que tú eliges.</p>
      </div>
      <Suspense>
        <AutopayPanel />
      </Suspense>
    </div>
  )
}
