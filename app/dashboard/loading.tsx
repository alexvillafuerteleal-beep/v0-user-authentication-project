import { LogoAnimated } from "@/components/brand/logo-animated"

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <LogoAnimated loop className="h-16 w-16" />
      <p className="text-sm text-muted-foreground">Cargando tu panel…</p>
    </div>
  )
}
