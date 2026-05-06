// Sentry Client Configuration - Error tracking & monitoring
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0, // Capture 100% of traces for debugging
    
    // Performance monitoring - Sentry v8 API
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Client-side config
    beforeSend(event) {
      // Filter out certain errors or add custom logic
      if (event.exception) {
        const error = event.exception.values?.[0];
        // Don't send 404s or network timeouts in dev
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
      }
      return event;
    },
  });
}

export default Sentry;
