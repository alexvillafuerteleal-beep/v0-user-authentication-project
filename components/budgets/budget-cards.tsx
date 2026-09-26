"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { serviceLabel, formatMXN } from "@/lib/services-meta"
import { cn } from "@/lib/utils"

type Item = {
  service_type: string
  provider: string | null
  last_amount: number | null
  spent: number
  period_limit: number | null
  alert_at_pct: number
}

/** Anillo de avance: el color y la etiqueta cambian al llegar al porcentaje de alerta y al rebasar el límite. */
function BudgetRing({ spent, limit, alertAt }: { spent: number; limit: number; alertAt: number }) {
  const pct = (spent / limit) * 100
  const state = pct >= 100 ? "over" : pct >= alertAt ? "near" : "ok"
  const r = 34
  const circumference = 2 * Math.PI * r
  const dash = Math.min(pct, 100) / 100 * circumference
  const color = state === "over" ? "var(--destructive)" : state === "near" ? "#d97706" : "var(--primary)"
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0 -rotate-90" role="img" aria-label={`${Math.round(pct)}% del presupuesto usado`}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--muted)" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} />
      </svg>
      <div>
        <p className="font-mono text-2xl font-bold tabular-nums">{Math.round(pct)}%</p>
        <p
          className={cn(
            "text-xs font-semibold",
            state === "over" ? "text-destructive" : state === "near" ? "text-amber-700 dark:text-amber-300" : "text-primary",
          )}
        >
          {state === "over" ? "Rebasaste el límite" : state === "near" ? "Cerca del límite" : "Dentro del presupuesto"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatMXN(spent)} de {formatMXN(limit)}
        </p>
      </div>
    </div>
  )
}

function BudgetCard({ item, onSaved }: { item: Item; onSaved: () => void }) {
  const { toast } = useToast()
  const suggested = item.last_amount ? Math.ceil(Number(item.last_amount) * 1.1) : ""
  const [limit, setLimit] = useState(item.period_limit != null ? String(item.period_limit) : "")
  const [alertAt, setAlertAt] = useState(String(item.alert_at_pct))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const value = Number(limit)
    if (!(value > 0)) {
      toast({ title: "Escribe un límite mayor a cero", variant: "destructive" })
      return
    }
    setSaving(true)
    const res = await fetch("/api/budgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_type: item.service_type, period_limit: value, alert_at_pct: Number(alertAt) }),
    })
    setSaving(false)
    if (!res.ok) {
      toast({ title: "No se guardó el presupuesto", variant: "destructive" })
      return
    }
    toast({ title: `Presupuesto de ${serviceLabel(item.service_type)} guardado` })
    onSaved()
  }

  const remove = async () => {
    await fetch(`/api/budgets?service_type=${encodeURIComponent(item.service_type)}`, { method: "DELETE" })
    setLimit("")
    onSaved()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{serviceLabel(item.service_type)}</CardTitle>
        <CardDescription>{item.provider ?? "Sin proveedor"} · gastado este mes {formatMXN(item.spent)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.period_limit ? (
          <BudgetRing spent={item.spent} limit={item.period_limit} alertAt={item.alert_at_pct} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Sin presupuesto.{suggested !== "" && ` Te sugerimos ${formatMXN(Number(suggested), 0)}: tu último recibo más 10%.`}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`b-limit-${item.service_type}`}>Límite mensual</Label>
            <Input
              id={`b-limit-${item.service_type}`}
              type="number"
              inputMode="decimal"
              min="1"
              placeholder={suggested !== "" ? String(suggested) : "0"}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`b-alert-${item.service_type}`}>Avisarme al</Label>
            <Select value={alertAt} onValueChange={setAlertAt}>
              <SelectTrigger id={`b-alert-${item.service_type}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[50, 70, 80, 90, 100].map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} className="flex-1">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
          {item.period_limit != null && (
            <Button variant="outline" onClick={remove}>
              Quitar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function BudgetCards() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [month, setMonth] = useState("")
  const [available, setAvailable] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch("/api/budgets")
    const data = res.ok ? await res.json() : { items: [] }
    setItems(data.items ?? [])
    setMonth(data.month ?? "")
    setAvailable(data.available !== false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (items === null) return <div className="h-48 animate-pulse rounded-xl bg-muted/40" aria-label="Cargando presupuestos" />
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Agrega tus servicios en Mis Pagos para ponerles presupuesto.</p>

  return (
    <div className="space-y-3">
      {month && <p className="text-sm text-muted-foreground first-letter:uppercase">{month}</p>}
      {!available && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          Por ahora no se pueden guardar presupuestos en este servidor. Puedes ver lo que llevas gastado en cada servicio.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <BudgetCard key={item.service_type} item={item} onSaved={load} />
        ))}
      </div>
    </div>
  )
}
