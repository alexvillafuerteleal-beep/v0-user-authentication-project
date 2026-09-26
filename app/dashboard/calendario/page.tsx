import { DueCalendar } from "@/components/calendar/due-calendar"

export const metadata = { title: "Calendario · PagoIA" }

export default function CalendarioPage() {
  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">Calendario</h1>
        <p className="mt-1 text-muted-foreground">Todos tus vencimientos en un mes, con recordatorios para que no se te pase ninguno.</p>
      </div>
      <DueCalendar />
    </div>
  )
}
