"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Reportar a Sentry si está configurado
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs").then(({ captureException }) => {
        captureException(error)
      })
    }
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <html lang="es">
      <body className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-foreground">Algo salió mal</h1>
          <p className="text-muted-foreground">
            Ocurrió un error inesperado. El equipo ha sido notificado automáticamente.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              ID: {error.digest}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={reset} variant="default">
              Intentar de nuevo
            </Button>
            <Button onClick={() => (window.location.href = "/")} variant="outline">
              Volver al inicio
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
