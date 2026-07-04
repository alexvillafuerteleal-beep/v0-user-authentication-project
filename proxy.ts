// proxy.ts — Next.js 16.2+ (replaces middleware.ts)
// Mantener este archivo sin imports pesados (Sentry, Supabase, etc.):
// cualquier fallo aquí tumba TODAS las rutas con MIDDLEWARE_INVOCATION_FAILED.
import { NextResponse } from 'next/server'

export function proxy() {
  const response = NextResponse.next()
  response.headers.set('x-request-id', crypto.randomUUID())
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
