'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Reports Core Web Vitals to our API so we can watch LCP / CLS / INP / FCP / TTFB
 * over time. Metrics are sent via `navigator.sendBeacon` when available so they
 * survive the page unload without blocking.
 *
 * The API endpoint is `POST /api/v1/metrics/web-vitals` — it accepts the shape Google's
 * web-vitals library emits and ignores anything it doesn't recognise. No-op when the
 * beacon fails (never block the page on analytics).
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating: metric.rating,
      navigationType: metric.navigationType,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      timestamp: Date.now(),
    });
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/metrics/web-vitals`;
    try {
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      } else {
        void fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
          keepalive: true,
        });
      }
    } catch {
      /* analytics failures never block the page */
    }
  });
  return null;
}
