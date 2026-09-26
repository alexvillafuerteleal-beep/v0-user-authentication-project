"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Copy, Loader2, Users, UserPlus, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { equalShares } from "@/lib/splits"
import { formatMXN, serviceLabel } from "@/lib/services-meta"
import { cn } from "@/lib/utils"

type Member = { user_id: string; role: string; display_name: string }
type Split = {
  id: string
  description: string
  total_amount: number
  user_id: string
  created_by: string
  share_pct: number
  amount_owed: number
  status: "pending" | "paid"
  created_at: string
}
type Household = { id: string; name: string; isOwner: boolean; members: Member[]; splits: Split[] }
type Tx = { id: string; service_type: string | null; provider: string | null; amount: number; transaction_date: string }

const post = (url: string, body?: unknown, method = "POST") =>
  fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({
    ok: r.ok,
    data: await r.json().catch(() => ({})),
  }))

export function HouseholdPanel() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(true)
  const [userId, setUserId] = useState("")
  const [households, setHouseholds] = useState<Household[]>([])
  const [recent, setRecent] = useState<Tx[]>([])
  const [newName, setNewName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch("/api/households")
    const data = res.ok ? await res.json() : { available: false, households: [] }
    setAvailable(data.available !== false)
    setUserId(data.userId ?? "")
    setHouseholds(data.households ?? [])
    setRecent(data.recentTransactions ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    if (!newName.trim()) return
    setBusy(true)
    const { ok, data } = await post("/api/households", { name: newName.trim() })
    setBusy(false)
    if (!ok) return toast({ title: data.error ?? "No se pudo crear el hogar", variant: "destructive" })
    setNewName("")
    toast({ title: "Hogar creado", description: "Genera un código para invitar a quienes viven contigo." })
    load()
  }

  const join = async () => {
    if (!joinCode.trim()) return
    setBusy(true)
    const { ok, data } = await post("/api/households/join", { code: joinCode.trim() })
    setBusy(false)
    if (!ok) return toast({ title: data.error ?? "No se pudo unir al hogar", variant: "destructive" })
    setJoinCode("")
    toast({ title: "Te uniste al hogar" })
    load()
  }

  if (loading) return <div className="h-48 animate-pulse rounded-xl bg-muted/40" aria-label="Cargando hogar" />
  if (!available)
    return (
      <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
        El hogar compartido todavía no está disponible en este servidor.
      </p>
    )

  return (
    <div className="space-y-6">
      {households.map((h) => (
        <HouseholdCard key={h.id} household={h} userId={userId} recent={recent} onChange={load} />
      ))}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" /> Crear un hogar
            </CardTitle>
            <CardDescription>Para roommates o familia: comparten recibos y cada quien ve lo que le toca pagar.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input aria-label="Nombre del hogar" placeholder="Depa Roma Norte" value={newName} maxLength={60} onChange={(e) => setNewName(e.target.value)} />
            <Button onClick={create} disabled={busy || !newName.trim()}>
              Crear
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5" /> Unirme con un código
            </CardTitle>
            <CardDescription>Pídele el código de 8 caracteres a quien creó el hogar.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              aria-label="Código de invitación"
              placeholder="K7M2QX9P"
              value={joinCode}
              maxLength={12}
              className="font-mono uppercase"
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
            <Button variant="outline" onClick={join} disabled={busy || joinCode.trim().length < 6}>
              Unirme
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function HouseholdCard({ household: h, userId, recent, onChange }: { household: Household; userId: string; recent: Tx[]; onChange: () => void }) {
  const { toast } = useToast()
  const [code, setCode] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [txId, setTxId] = useState<string>("manual")
  const [pcts, setPcts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const nameOf = (id: string) => (id === userId ? "Tú" : (h.members.find((m) => m.user_id === id)?.display_name ?? "Alguien"))

  useEffect(() => {
    const shares = equalShares(Math.max(1, h.members.length))
    setPcts(Object.fromEntries(h.members.map((m, i) => [m.user_id, String(shares[i])])))
  }, [h.members])

  const totalPct = useMemo(() => Object.values(pcts).reduce((s, v) => s + (Number(v) || 0), 0), [pcts])

  const invite = async () => {
    const { ok, data } = await post(`/api/households/${h.id}/invite`)
    if (!ok) return toast({ title: data.error ?? "No se pudo generar el código", variant: "destructive" })
    setCode(data.code)
  }

  const copyCode = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      toast({ title: "Código copiado" })
    } catch {
      toast({ title: `Tu código es ${code}` })
    }
  }

  const pickTransaction = (value: string) => {
    setTxId(value)
    const tx = recent.find((t) => t.id === value)
    if (tx) {
      setDescription(`${serviceLabel(tx.service_type)} · ${tx.provider ?? ""}`.trim())
      setAmount(String(tx.amount))
    }
  }

  const split = async () => {
    const total = Number(amount)
    if (!description.trim() || !(total > 0)) return toast({ title: "Escribe qué pagaste y el monto", variant: "destructive" })
    if (Math.abs(totalPct - 100) > 0.01) return toast({ title: "Los porcentajes deben sumar 100%", variant: "destructive" })
    setSaving(true)
    const { ok, data } = await post(`/api/households/${h.id}/splits`, {
      description: description.trim(),
      total_amount: total,
      transaction_id: txId === "manual" ? undefined : txId,
      shares: h.members.map((m) => ({ user_id: m.user_id, share_pct: Number(pcts[m.user_id]) })).filter((s) => s.share_pct > 0),
    })
    setSaving(false)
    if (!ok) return toast({ title: data.error ?? "No se pudo dividir el pago", variant: "destructive" })
    setDescription("")
    setAmount("")
    setTxId("manual")
    toast({ title: "Pago dividido", description: "Cada persona ya ve lo que le toca." })
    onChange()
  }

  const settle = async (id: string) => {
    const { ok } = await post(`/api/households/splits/${id}`, undefined, "PATCH")
    if (!ok) return toast({ title: "No se pudo marcar como pagada", variant: "destructive" })
    onChange()
  }

  const iOwe = h.splits.filter((s) => s.user_id === userId && s.created_by !== userId && s.status === "pending")
  const owedToMe = h.splits.filter((s) => s.created_by === userId && s.user_id !== userId && s.status === "pending")
  const settled = h.splits.filter((s) => s.status === "paid" && s.user_id !== s.created_by).slice(0, 8)
  const sumOf = (xs: Split[]) => xs.reduce((a, s) => a + Number(s.amount_owed), 0)

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>{h.name}</CardTitle>
          <CardDescription>{h.members.map((m) => (m.user_id === userId ? "Tú" : m.display_name)).join(" · ")}</CardDescription>
        </div>
        {h.isOwner && (
          <div className="flex items-center gap-2">
            {code ? (
              <Button variant="outline" onClick={copyCode} className="font-mono tracking-widest">
                {code} <Copy className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" onClick={invite}>
                <UserPlus className="mr-2 h-4 w-4" /> Invitar
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {code && <p className="-mt-3 text-xs text-muted-foreground">El código vale para una persona y vence en 7 días.</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Debes</p>
            <p className="font-mono text-2xl font-bold tabular-nums">{formatMXN(sumOf(iOwe))}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Te deben</p>
            <p className="font-mono text-2xl font-bold tabular-nums text-primary">{formatMXN(sumOf(owedToMe))}</p>
          </div>
        </div>

        {(iOwe.length > 0 || owedToMe.length > 0) && (
          <ul className="divide-y divide-border text-sm">
            {[...iOwe, ...owedToMe].map((s) => {
              const mine = s.user_id === userId
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium">{s.description}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {mine ? `le debes a ${nameOf(s.created_by)}` : `${nameOf(s.user_id)} te debe`} ({s.share_pct}%)
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono tabular-nums">{formatMXN(Number(s.amount_owed))}</span>
                    <Button size="sm" variant={mine ? "default" : "outline"} onClick={() => settle(s.id)}>
                      {mine ? "Ya pagué" : "Ya me pagó"}
                    </Button>
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        {h.members.length > 1 ? (
          <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
            <p className="text-sm font-semibold">Dividir un pago</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor={`tx-${h.id}`}>Pago</Label>
                <Select value={txId} onValueChange={pickTransaction}>
                  <SelectTrigger id={`tx-${h.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Escribir otro pago</SelectItem>
                    {recent.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {serviceLabel(t.service_type)} · {t.provider ?? ""} · {formatMXN(Number(t.amount))} ·{" "}
                        {new Date(t.transaction_date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`desc-${h.id}`}>Qué pagaste</Label>
                <Input id={`desc-${h.id}`} value={description} maxLength={120} onChange={(e) => setDescription(e.target.value)} placeholder="Luz de agosto" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`amt-${h.id}`}>Monto (MXN)</Label>
                <Input id={`amt-${h.id}`} type="number" inputMode="decimal" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              {h.members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between gap-3 text-sm">
                  <span>{m.user_id === userId ? "Tú" : m.display_name}</span>
                  <span className="flex items-center gap-2">
                    <span className="w-20 text-right font-mono text-muted-foreground tabular-nums">
                      {amount ? formatMXN(((Number(amount) || 0) * (Number(pcts[m.user_id]) || 0)) / 100) : ""}
                    </span>
                    <Input
                      aria-label={`Porcentaje de ${m.display_name}`}
                      type="number"
                      inputMode="decimal"
                      className="h-8 w-20 text-right"
                      value={pcts[m.user_id] ?? ""}
                      onChange={(e) => setPcts((p) => ({ ...p, [m.user_id]: e.target.value }))}
                    />
                    %
                  </span>
                </div>
              ))}
              <p className={cn("text-right text-xs", Math.abs(totalPct - 100) > 0.01 ? "text-destructive" : "text-muted-foreground")}>
                Total: {Math.round(totalPct * 100) / 100}%
              </p>
            </div>
            <Button onClick={split} disabled={saving} className="w-full sm:w-auto">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dividir pago
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Invita al menos a una persona para dividir pagos.</p>
        )}

        {settled.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold">Saldado</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {settled.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  {s.description} · {nameOf(s.user_id)} pagó {formatMXN(Number(s.amount_owed))}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
