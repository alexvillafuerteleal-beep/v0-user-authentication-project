"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, Loader2, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { serviceLabel, formatMXN } from "@/lib/services-meta"
import { cn } from "@/lib/utils"

type Service = { id: string; service_type: string; provider: string | null; last_amount: number | null }
type Schedule = { id: string; user_service_id: string; max_amount: number; days_before: number; active: boolean }
type Run = { id: string; amount: number; status: "processing" | "succeeded" | "failed"; reason: string | null; created_at: string }
type Data = {
  available: boolean
  stripeConfigured?: boolean
  testMode?: boolean
  chargesAllowed?: boolean
  card?: { brand: string | null; last4: string | null; exp: string | null } | null
  schedules?: Schedule[]
  runs?: Run[]
  services: Service[]
}

const DAY_OPTIONS = [0, 1, 2, 3, 5]
const RUN_META = {
  succeeded: { label: "Cobrado", icon: CheckCircle2, className: "text-green-700 dark:text-green-300" },
  processing: { label: "En proceso", icon: Clock, className: "text-amber-800 dark:text-amber-300" },
  failed: { label: "Rechazado", icon: XCircle, className: "text-destructive" },
} as const

function ScheduleRow({ service, schedule, hasCard, onSaved }: { service: Service; schedule?: Schedule; hasCard: boolean; onSaved: () => void }) {
  const { toast } = useToast()
  const suggested = service.last_amount ? String(Math.ceil(Number(service.last_amount) * 1.3)) : ""
  const [active, setActive] = useState(schedule?.active ?? false)
  const [max, setMax] = useState(schedule ? String(schedule.max_amount) : suggested)
  const [days, setDays] = useState(String(schedule?.days_before ?? 1))
  const [saving, setSaving] = useState(false)
  const dirty =
    active !== (schedule?.active ?? false) || max !== (schedule ? String(schedule.max_amount) : suggested) || days !== String(schedule?.days_before ?? 1)

  const save = async () => {
    const maxAmount = Number(max)
    if (!(maxAmount > 0)) {
      toast({ title: "Escribe un tope mayor a $0", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/autopay", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_service_id: service.id, max_amount: maxAmount, days_before: Number(days), active }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? "Intenta de nuevo.")
      toast({ title: active ? "Pago automático activado" : "Pago automático pausado" })
      onSaved()
    } catch (error) {
      toast({ title: "No se guardó", description: error instanceof Error ? error.message : undefined, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const id = `auto-${service.id}`
  return (
    <li className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="flex items-center gap-3">
        <Switch id={id} checked={active} disabled={!hasCard} onCheckedChange={setActive} aria-label={`Pago automático de ${serviceLabel(service.service_type)}`} />
        <Label htmlFor={id} className="flex flex-col items-start gap-0.5">
          <span className="font-medium">{serviceLabel(service.service_type)}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {service.provider ?? "Sin proveedor"}
            {service.last_amount ? ` · último recibo ${formatMXN(Number(service.last_amount))}` : ""}
          </span>
        </Label>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${id}-max`} className="text-xs text-muted-foreground">
            Tope por recibo
          </Label>
          <Input
            id={`${id}-max`}
            type="number"
            inputMode="decimal"
            min={10}
            max={20000}
            step="1"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="h-9 w-32 font-mono tabular-nums"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cobrar</Label>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="h-9 w-40" aria-label="Cuándo cobrar">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d === 0 ? "El día que vence" : d === 1 ? "1 día antes" : `${d} días antes`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-9" onClick={save} disabled={saving || !dirty || !hasCard}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar
        </Button>
      </div>
    </li>
  )
}

export function AutopayPanel() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useSearchParams()
  const [data, setData] = useState<Data | null>(null)
  const [busy, setBusy] = useState<"setup" | "remove" | null>(null)
  const confirmed = useRef(false)

  const load = useCallback(async () => {
    const res = await fetch("/api/autopay")
    setData(res.ok ? await res.json() : { available: false, services: [] })
  }, [])

  // Al volver de Stripe se confirma la tarjeta y se limpia la URL.
  useEffect(() => {
    const sessionId = params.get("session_id")
    if (params.get("tarjeta") !== "lista" || !sessionId || confirmed.current) {
      load()
      return
    }
    confirmed.current = true
    fetch(`/api/autopay/card?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => {
        if (res.ok) toast({ title: "Tarjeta guardada", description: "Ya puedes activar pagos automáticos." })
        else toast({ title: "No se pudo guardar la tarjeta", description: (await res.json().catch(() => ({}))).error, variant: "destructive" })
      })
      .finally(() => {
        router.replace("/dashboard/programados")
        load()
      })
  }, [params, load, router, toast])

  const setupCard = async () => {
    setBusy("setup")
    try {
      const res = await fetch("/api/autopay/card", { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.url) throw new Error(body.error ?? "Intenta de nuevo.")
      window.location.href = body.url
    } catch (error) {
      toast({ title: "No se pudo abrir Stripe", description: error instanceof Error ? error.message : undefined, variant: "destructive" })
      setBusy(null)
    }
  }

  const removeCard = async () => {
    if (!window.confirm("¿Quitar la tarjeta? Se pausarán todos tus pagos automáticos.")) return
    setBusy("remove")
    await fetch("/api/autopay/card", { method: "DELETE" })
    setBusy(null)
    toast({ title: "Tarjeta eliminada", description: "Tus pagos automáticos quedaron en pausa." })
    load()
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    )
  }

  if (!data.available) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagos automáticos no disponibles</CardTitle>
          <CardDescription>
            Falta aplicar la migración <code className="font-mono text-xs">20260930_whatsapp_pagos_automaticos.sql</code> en Supabase.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const card = data.card
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Tarjeta para pagos automáticos
          </CardTitle>
          <CardDescription>Stripe guarda la tarjeta; PagoIA solo conoce la marca y los últimos 4 dígitos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {card ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
              <div>
                <p className="font-medium capitalize">
                  {card.brand ?? "Tarjeta"} <span className="font-mono tabular-nums">•••• {card.last4}</span>
                </p>
                {card.exp && <p className="text-xs text-muted-foreground">Vence {card.exp}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={setupCard} disabled={busy !== null}>
                  {busy === "setup" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cambiar
                </Button>
                <Button variant="ghost" size="sm" onClick={removeCard} disabled={busy !== null}>
                  {busy === "remove" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Quitar
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={setupCard} disabled={busy !== null || !data.stripeConfigured}>
              {busy === "setup" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar una tarjeta
            </Button>
          )}

          {data.testMode && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Modo de prueba: no se mueve dinero real. Usa la tarjeta 4242 4242 4242 4242 con cualquier fecha futura y CVC.
            </p>
          )}
          {!data.chargesAllowed && data.stripeConfigured && (
            <p className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Los cobros automáticos están apagados con llaves reales de Stripe, porque PagoIA todavía no le paga al proveedor del servicio.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Servicios</CardTitle>
          <CardDescription>
            Cuando registras un recibo en Recibos, lo cobramos a tu tarjeta en la fecha que elijas, solo si no pasa tu tope. Si pasa del tope, te
            avisamos y no cobramos nada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Agrega tus servicios en Mis Pagos para programar pagos automáticos.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.services.map((s) => (
                <ScheduleRow
                  key={s.id}
                  service={s}
                  schedule={data.schedules?.find((x) => x.user_service_id === s.id)}
                  hasCard={Boolean(card)}
                  onSaved={load}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos cobros automáticos</CardTitle>
        </CardHeader>
        <CardContent>
          {!data.runs?.length ? (
            <p className="text-sm text-muted-foreground">Todavía no hay cobros automáticos.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.runs.map((r) => {
                const meta = RUN_META[r.status]
                const Icon = meta.icon
                return (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                      {r.reason && <span className="block text-xs">{r.reason}</span>}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono tabular-nums">{formatMXN(Number(r.amount))}</span>
                      <span className={cn("flex items-center gap-1 text-xs font-medium", meta.className)}>
                        <Icon className="h-3.5 w-3.5" /> {meta.label}
                      </span>
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
