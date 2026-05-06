// Sentry Server Configuration - Server-side error tracking
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    
    // Server-side specific integrations - Sentry v8 API
    integrations: [
      Sentry.httpIntegration(),
    ],
    
    // Capture unhandled rejections
    attachStacktrace: true,
  });
}

export { Sentry };
