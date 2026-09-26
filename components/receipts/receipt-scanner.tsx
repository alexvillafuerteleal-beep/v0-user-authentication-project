"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Camera, FileUp, Loader2, ScanLine, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const SERVICE_LABELS: Record<string, string> = {
  electricity: "Luz",
  water: "Agua",
  gas: "Gas",
  internet: "Internet",
  phone: "Teléfono",
  other: "Otro",
}

const CONSENT_KEY = "pagoia-receipt-consent-v1"

type Receipt = {
  id: string
  storage_path: string
  service_type: string | null
  provider: string | null
  service_number_last4: string | null
  period_start: string | null
  period_end: string | null
  due_date: string | null
  amount: number | null
  consumption: number | null
  consumption_unit: string | null
  confidence: number | null
  status: "pending_review" | "confirmed" | "rejected"
  created_at: string
}

type Form = {
  provider: string
  service_type: string
  amount: string
  due_date: string
  period_start: string
  period_end: string
  consumption: string
}

type Stage = "idle" | "uploading" | "analyzing" | "review" | "saving"

const toForm = (r: Receipt): Form => ({
  provider: r.provider ?? "",
  service_type: r.service_type ?? "electricity",
  amount: r.amount != null ? String(r.amount) : "",
  due_date: r.due_date ?? "",
  period_start: r.period_start ?? "",
  period_end: r.period_end ?? "",
  consumption: r.consumption != null ? String(r.consumption) : "",
})

/** Reduce fotos grandes del celular a 2000 px en JPEG para no rebasar el límite de 5 MB. */
async function prepareImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.size < 1.5 * 1024 * 1024) return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.85))
}

const formatMoney = (n: number | null) =>
  n == null ? "—" : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
const formatDate = (d: string | null) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—"

export function ReceiptScanner() {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const [consent, setConsent] = useState(false)
  const [stage, setStage] = useState<Stage>("idle")
  const [current, setCurrent] = useState<Receipt | null>(null)
  const [dudosos, setDudosos] = useState<string[]>([])
  const [form, setForm] = useState<Form | null>(null)
  const [history, setHistory] = useState<Receipt[]>([])

  useEffect(() => {
    try {
      setConsent(localStorage.getItem(CONSENT_KEY) === "1")
    } catch {}
  }, [])

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.from("receipts").select("*").order("created_at", { ascending: false }).limit(10)
    setHistory((data as Receipt[]) ?? [])
  }, [supabase])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const acceptConsent = (checked: boolean) => {
    setConsent(checked)
    try {
      if (checked) localStorage.setItem(CONSENT_KEY, "1")
      else localStorage.removeItem(CONSENT_KEY)
    } catch {}
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      toast({ title: "Formato no compatible", description: "Sube una foto (JPG, PNG o WebP) o un PDF.", variant: "destructive" })
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setStage("uploading")
    try {
      const blob = await prepareImage(file)
      const ext = blob.type === "application/pdf" ? "pdf" : blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg"
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from("receipts").upload(path, blob, { contentType: blob.type })
      if (uploadError) throw new Error("No se pudo subir el archivo. Revisa tu conexión e intenta de nuevo.")

      setStage("analyzing")
      const res = await fetch("/api/receipts/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo analizar el recibo.")

      setCurrent(data.receipt)
      setDudosos(data.dudosos ?? [])
      setForm(toForm(data.receipt))
      setStage("review")
      loadHistory()
    } catch (error) {
      setStage("idle")
      toast({ title: "No pudimos leer el recibo", description: error instanceof Error ? error.message : String(error), variant: "destructive" })
    } finally {
      if (fileInput.current) fileInput.current.value = ""
      if (cameraInput.current) cameraInput.current.value = ""
    }
  }

  const review = async (action: "confirm" | "reject") => {
    if (!current || !form) return
    const amount = Number(form.amount)
    if (action === "confirm" && (!form.provider.trim() || !(amount > 0))) {
      toast({ title: "Faltan datos", description: "Revisa el proveedor y el monto antes de confirmar.", variant: "destructive" })
      return
    }
    setStage("saving")
    const body =
      action === "reject"
        ? { action }
        : {
            action,
            fields: {
              provider: form.provider.trim(),
              service_type: form.service_type,
              amount,
              due_date: form.due_date || null,
              period_start: form.period_start || null,
              period_end: form.period_end || null,
              consumption: form.consumption ? Number(form.consumption) : null,
            },
          }
    const res = await fetch(`/api/receipts/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setStage("review")
      toast({ title: "No se pudo guardar", description: data.error || "Intenta de nuevo.", variant: "destructive" })
      return
    }
    toast({
      title: action === "confirm" ? "Recibo guardado" : "Recibo descartado",
      description: action === "confirm" ? `Agregamos un pago pendiente de ${formatMoney(amount)}.` : undefined,
    })
    setCurrent(null)
    setForm(null)
    setDudosos([])
    setStage("idle")
    loadHistory()
  }

  const field = (key: keyof Form, label: string, type = "text", hint?: string) => {
    const dudoso =
      (key === "provider" && dudosos.includes("proveedor")) ||
      (key === "amount" && dudosos.includes("total")) ||
      (key === "due_date" && dudosos.includes("fecha_limite")) ||
      (key === "period_start" && dudosos.includes("periodo_inicio")) ||
      (key === "period_end" && dudosos.includes("periodo_fin")) ||
      (key === "consumption" && dudosos.includes("consumo"))
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`rc-${key}`}>{label}</Label>
        <Input
          id={`rc-${key}`}
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          step={type === "number" ? "0.01" : undefined}
          value={form?.[key] ?? ""}
          onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
          className={cn(dudoso && "border-amber-500 ring-2 ring-amber-500/30")}
          aria-describedby={dudoso ? `rc-${key}-hint` : undefined}
        />
        {dudoso ? (
          <p id={`rc-${key}-hint`} className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3" /> No se leía bien. Revisa este dato.
          </p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    )
  }

  const busy = stage === "uploading" || stage === "analyzing" || stage === "saving"

  return (
    <div className="space-y-6">
      {stage !== "review" && stage !== "saving" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-brand-spark" /> Escanear un recibo
            </CardTitle>
            <CardDescription>
              Tómale foto a tu recibo de luz, agua, gas o internet, o sube el PDF. Capturamos el monto, la fecha límite y el
              periodo; tú revisas antes de guardar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <Checkbox checked={consent} onCheckedChange={(v) => acceptConsent(v === true)} className="mt-0.5" id="rc-consent" />
              <span>
                Acepto que la imagen de mi recibo se envíe a Anthropic (Estados Unidos) solo para extraer sus datos. Guardamos
                únicamente los últimos 4 dígitos de mi número de servicio.
              </span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button size="lg" disabled={!consent || busy} onClick={() => cameraInput.current?.click()} className="h-14">
                <Camera className="mr-2 h-5 w-5" /> Tomar foto
              </Button>
              <Button size="lg" variant="outline" disabled={!consent || busy} onClick={() => fileInput.current?.click()} className="h-14">
                <FileUp className="mr-2 h-5 w-5" /> Subir foto o PDF
              </Button>
            </div>
            <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={(e) => handleFile(e.target.files?.[0])} />

            {busy && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <Loader2 className="h-4 w-4 animate-spin" />
                {stage === "uploading" ? "Subiendo tu recibo…" : "Leyendo tu recibo…"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {(stage === "review" || stage === "saving") && form && current && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle>Revisa lo que capturamos</CardTitle>
            <CardDescription>
              {dudosos.length === 0
                ? "Todos los campos se leyeron con claridad. Corrige lo que haga falta y confirma."
                : `Revisa los ${dudosos.length} campos marcados en ámbar antes de confirmar.`}
              {current.service_number_last4 && ` Número de servicio terminación ${current.service_number_last4}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {field("provider", "Proveedor")}
              <div className="space-y-1.5">
                <Label htmlFor="rc-service">Servicio</Label>
                <Select value={form.service_type} onValueChange={(v) => setForm((f) => (f ? { ...f, service_type: v } : f))}>
                  <SelectTrigger id="rc-service" className={cn(dudosos.includes("tipo_servicio") && "border-amber-500 ring-2 ring-amber-500/30")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {field("amount", "Total a pagar (MXN)", "number")}
              {field("due_date", "Fecha límite de pago", "date")}
              {field("period_start", "Inicio del periodo", "date")}
              {field("period_end", "Fin del periodo", "date")}
              {field("consumption", `Consumo${current.consumption_unit ? ` (${current.consumption_unit})` : ""}`, "number")}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" disabled={stage === "saving"} onClick={() => review("reject")}>
                Descartar
              </Button>
              <Button disabled={stage === "saving"} onClick={() => review("confirm")}>
                {stage === "saving" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirmar y crear pago
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recibos recientes</CardTitle>
          <CardDescription>
            Los recibos confirmados aparecen como pagos pendientes en{" "}
            <Link href="/dashboard/servicios" className="text-primary underline-offset-4 hover:underline">
              Mis Pagos
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no has escaneado recibos.</p>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {SERVICE_LABELS[r.service_type ?? "other"] ?? "Servicio"} · {r.provider ?? "Proveedor sin leer"}
                    </p>
                    <p className="text-muted-foreground">
                      Vence {formatDate(r.due_date)} · escaneado {formatDate(r.created_at.slice(0, 10))}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums">{formatMoney(r.amount)}</span>
                    <StatusChip status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusChip({ status }: { status: Receipt["status"] }) {
  if (status === "confirmed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300">
        <CheckCircle2 className="h-3 w-3" /> Confirmado
      </span>
    )
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
        <XCircle className="h-3 w-3" /> Descartado
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
      <AlertTriangle className="h-3 w-3" /> Por revisar
    </span>
  )
}
