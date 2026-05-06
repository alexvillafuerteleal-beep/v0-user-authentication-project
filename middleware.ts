// Advanced Logging & Monitoring Middleware
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

interface RequestMetrics {
  method: string;
  path: string;
  duration: number;
  status: number;
  userId?: string;
  userAgent: string;
  ipAddress: string;
  timestamp: string;
}

// In-memory metrics buffer
const metricsBuffer: RequestMetrics[] = [];
const MAX_BUFFER_SIZE = 1000;

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Extract metadata
  const userId = request.headers.get('x-user-id');
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipAddress = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Add request ID for tracing
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);

  return response;
}

export async function logRequest(
  method: string,
  path: string,
  status: number,
  duration: number,
  userId?: string
) {
  const metrics: RequestMetrics = {
    method,
    path,
    duration,
    status,
    userId,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    ipAddress: 'server-side',
    timestamp: new Date().toISOString(),
  };

  // Add to buffer
  metricsBuffer.push(metrics);

  // Flush if buffer full
  if (metricsBuffer.length >= MAX_BUFFER_SIZE) {
    await flushMetrics();
  }

  // Log slow requests to Sentry
  if (duration > 5000) {
    Sentry.captureMessage(
      `Slow request: ${method} ${path} took ${duration}ms`,
      'warning'
    );
  }

  // Log errors
  if (status >= 500) {
    Sentry.captureMessage(
      `Server error: ${method} ${path} returned ${status}`,
      'error'
    );
  }
}

export async function flushMetrics() {
  if (metricsBuffer.length === 0) return;

  const metrics = metricsBuffer.splice(0, MAX_BUFFER_SIZE);

  // Send to analytics endpoint or external service
  try {
    // Example: Send to Vercel Analytics API
    // await fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metrics)
    // });

    console.log(`[METRICS] Flushed ${metrics.length} requests`);
  } catch (error) {
    console.error('[METRICS] Error flushing metrics:', error);
    // Re-add to buffer for retry
    metricsBuffer.push(...metrics);
  }
}

// Analytics dashboard endpoint
export async function getMetricsSummary() {
  if (metricsBuffer.length === 0) return null;

  const totalRequests = metricsBuffer.length;
  const avgDuration = metricsBuffer.reduce((acc, m) => acc + m.duration, 0) / totalRequests;
  const errorCount = metricsBuffer.filter(m => m.status >= 400).length;
  const slowRequests = metricsBuffer.filter(m => m.duration > 1000).length;

  return {
    totalRequests,
    avgDuration: Math.round(avgDuration),
    errorRate: ((errorCount / totalRequests) * 100).toFixed(2) + '%',
    slowRequests,
    endpoints: groupByEndpoint(metricsBuffer),
  };
}

function groupByEndpoint(metrics: RequestMetrics[]) {
  return metrics.reduce((acc, metric) => {
    const key = `${metric.method} ${metric.path}`;
    if (!acc[key]) {
      acc[key] = { count: 0, totalDuration: 0, errors: 0 };
    }
    acc[key].count++;
    acc[key].totalDuration += metric.duration;
    if (metric.status >= 400) acc[key].errors++;
    return acc;
  }, {} as Record<string, any>);
}

// Export middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
