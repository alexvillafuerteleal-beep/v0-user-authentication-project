import { ReceiptScanner } from "@/components/receipts/receipt-scanner"

export const metadata = { title: "Recibos · PagoIA" }

export default function RecibosPage() {
  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">Recibos</h1>
        <p className="mt-1 text-muted-foreground">Escanea tus recibos y conviértelos en pagos pendientes en segundos.</p>
      </div>
      <ReceiptScanner />
    </div>
  )
}
