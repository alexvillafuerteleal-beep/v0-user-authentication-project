"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Clock, CircleDot, Bell, Mail, MessageCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { serviceLabel, formatMXN } from "@/lib/services-meta"
import { daysUntil, toISODate } from "@/lib/due-dates"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/app/api/calendar/route"

type State = "pagado" | "vencido" | "proximo" | "programado" | "pendiente"

const STATE_META: Record<State, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  pagado: { label: "Pagado", className: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30", icon: CheckCircle2 },
  vencido: { label: "Vencido", className: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30", icon: AlertTriangle },
  proximo: { label: "Vence pronto", className: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30", icon: Clock },
  programado: { label: "Programado", className: "bg-muted text-foreground border-border", icon: CircleDot },
  pendiente: { label: "Por pagar", className: "bg-primary/10 text-primary border-primary/30", icon: CircleDot },
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const DAY_OPTIONS = [0, 1, 2, 3, 5, 7]

type Service = { id: string; service_type: string; provider: string | null; status: string }
type Channel = "push" | "email" | "whatsapp"
type Reminder = { user_service_id: string; channel: Channel; days_before: number }

export function DueCalendar() {
  const { toast } = useToast()
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const monthParam = toISODate(cursor).slice(0, 7)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cal, rem] = await Promise.all([
        fetch(`/api/calendar?month=${monthParam}`).then((r) => r.json()),
        fetch("/api/reminders").then((r) => (r.ok ? r.json() : { reminders: [], emailEnabled: false })),
      ])
      setEvents(cal.events ?? [])
      setServices(cal.services ?? [])
      setReminders(rem.reminders ?? [])
      setEmailEnabled(Boolean(rem.emailEnabled))
      setWhatsappEnabled(Boolean(rem.whatsappEnabled))
      setWhatsappPhone(rem.whatsappPhone ?? null)
    } finally {
      setLoading(false)
    }
  }, [monthParam])

  useEffect(() => {
    load()
  }, [load])

  // Un vencimiento cuenta como pagado si hay un pago del mismo servicio ese mes.
  const withState = useMemo(() => {
    const paidTypes = new Set(events.filter((e) => e.kind === "pagado").map((e) => e.service_type))
    const today = new Date()
    // Servicios registrados dos veces generan eventos idénticos: se muestran una vez con "×n".
    const grouped = new Map<string, CalendarEvent & { count: number }>()
    for (const e of events) {
      const key = [e.date, e.kind, e.service_type, e.title, e.amount].join("|")
      const prev = grouped.get(key)
      if (prev) prev.count++
      else grouped.set(key, { ...e, count: 1 })
    }
    return [...grouped.values()]
      .filter((e) => !(e.kind === "vence" && paidTypes.has(e.service_type)))
      .map((e) => {
        let state: State = "programado"
        if (e.kind === "pagado") state = "pagado"
        else if (e.kind === "pendiente") state = "pendiente"
        else {
          const d = daysUntil(new Date(`${e.date}T12:00:00`), today)
          state = d < 0 ? "vencido" : d <= 3 ? "proximo" : "programado"
        }
        return { ...e, state }
      })
  }, [events])

  const cells = useMemo(() => {
    const first = new Date(cursor)
    const offset = (first.getDay() + 6) % 7 // lunes = 0
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))]
  }, [cursor])

  const todayISO = toISODate(new Date())

  const saveReminder = async (serviceId: string, channels: Channel[], days: number) => {
    const res = await fetch("/api/reminders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_service_id: serviceId, channels, days_before: days }),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: null }))
      toast({ title: "No se guardó el recordatorio", description: error ?? "Intenta de nuevo.", variant: "destructive" })
      return
    }
    setReminders((prev) => [
      ...prev.filter((r) => r.user_service_id !== serviceId),
      ...channels.map((channel) => ({ user_service_id: serviceId, channel, days_before: days })),
    ])
    toast({ title: channels.length ? "Recordatorio guardado" : "Recordatorio desactivado" })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="first-letter:uppercase">{cursor.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}</CardTitle>
            <CardDescription>Vencimientos de tus servicios, pagos por hacer y pagos hechos.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" aria-label="Mes anterior" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 text-xs">
            {(Object.keys(STATE_META) as State[]).map((s) => {
              const Icon = STATE_META[s].icon
              return (
                <span key={s} className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5", STATE_META[s].className)}>
                  <Icon className="h-3 w-3" /> {STATE_META[s].label}
                </span>
              )
            })}
          </div>

          <div className={cn("grid grid-cols-7 gap-1 text-sm", loading && "opacity-60")} aria-busy={loading}>
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-1 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const iso = toISODate(day)
              const dayEvents = withState.filter((e) => e.date === iso)
              return (
                <div
                  key={iso}
                  className={cn(
                    "flex min-h-16 flex-col gap-1 rounded-md border border-border/60 p-1 sm:min-h-24",
                    iso === todayISO && "border-primary ring-1 ring-primary",
                  )}
                >
                  <span className={cn("text-xs tabular-nums", iso === todayISO ? "font-bold text-primary" : "text-muted-foreground")}>{day.getDate()}</span>
                  {dayEvents.map((e, j) => {
                    const Icon = STATE_META[e.state].icon
                    return (
                      <span
                        key={j}
                        title={`${serviceLabel(e.service_type)} · ${STATE_META[e.state].label}${e.amount != null ? ` · ${formatMXN(e.amount)}` : ""}`}
                        className={cn("flex items-center gap-1 truncate rounded border px-1 py-0.5 text-[10px] leading-tight sm:text-xs", STATE_META[e.state].className)}
                      >
                        <Icon className="hidden h-3 w-3 shrink-0 sm:block" />
                        <span className="truncate">
                          {serviceLabel(e.service_type)}
                          {e.count > 1 && ` ×${e.count}`}
                        </span>
                      </span>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Este mes</h3>
            {withState.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay vencimientos ni pagos este mes.</p>
            ) : (
              <ul className="divide-y divide-border">
                {withState.map((e, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>
                      <span className="font-medium">
                        {serviceLabel(e.service_type)}
                        {e.count > 1 && ` ×${e.count}`}
                      </span>
                      <span className="text-muted-foreground"> · {e.title} · {new Date(`${e.date}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono tabular-nums">{formatMXN(e.amount)}</span>
                      <span className={cn("rounded-full border px-2 py-0.5 text-xs", STATE_META[e.state].className)}>{STATE_META[e.state].label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recordatorios</CardTitle>
          <CardDescription>
            Elige cómo y cuántos días antes quieres que te avisemos de cada vencimiento.
            {!emailEnabled && " Los avisos por correo se activan cuando el servidor tenga configurado el envío de correos."}
            {whatsappEnabled &&
              (whatsappPhone ? (
                ` Los avisos por WhatsApp llegan a ${whatsappPhone}.`
              ) : (
                <>
                  {" "}Para recibir avisos por WhatsApp, agrega tu celular en{" "}
                  <Link href="/dashboard/perfil" className="text-primary underline-offset-4 hover:underline">
                    tu perfil
                  </Link>
                  .
                </>
              ))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Agrega tus servicios en Mis Pagos para programar recordatorios.</p>
          ) : (
            <ul className="divide-y divide-border">
              {services.map((s) => {
                const mine = reminders.filter((r) => r.user_service_id === s.id)
                const channels = mine.map((r) => r.channel)
                const days = mine[0]?.days_before ?? 3
                const toggle = (channel: Channel, on: boolean) =>
                  saveReminder(s.id, on ? [...channels, channel] : channels.filter((c) => c !== channel), days)
                return (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <span className="font-medium">
                      {serviceLabel(s.service_type)} <span className="font-normal text-muted-foreground">· {s.provider ?? "Sin proveedor"}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2">
                        <Checkbox checked={channels.includes("push")} onCheckedChange={(v) => toggle("push", v === true)} />
                        <Bell className="h-4 w-4 text-muted-foreground" /> Notificación
                      </label>
                      <label className={cn("flex items-center gap-2", !emailEnabled && "opacity-50")}>
                        <Checkbox disabled={!emailEnabled} checked={channels.includes("email")} onCheckedChange={(v) => toggle("email", v === true)} />
                        <Mail className="h-4 w-4 text-muted-foreground" /> Correo
                      </label>
                      {whatsappEnabled && (
                        <label className={cn("flex items-center gap-2", !whatsappPhone && "opacity-50")}>
                          <Checkbox
                            disabled={!whatsappPhone}
                            checked={channels.includes("whatsapp")}
                            onCheckedChange={(v) => toggle("whatsapp", v === true)}
                          />
                          <MessageCircle className="h-4 w-4 text-muted-foreground" /> WhatsApp
                        </label>
                      )}
                      <Select
                        value={String(days)}
                        disabled={channels.length === 0}
                        onValueChange={(v) => saveReminder(s.id, channels, Number(v))}
                      >
                        <SelectTrigger className="h-8 w-36" aria-label="Días de anticipación">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAY_OPTIONS.map((d) => (
                            <SelectItem key={d} value={String(d)}>
                              {d === 0 ? "El mismo día" : d === 1 ? "1 día antes" : `${d} días antes`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
