/* eslint-disable no-console */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { ok } from '../lib/response.js';

/**
 * Web Vitals intake. The marketing site POSTs here via navigator.sendBeacon on every
 * metric emission. We don't persist — for now we just log so an ops pipeline (Loki /
 * Datadog / whatever) can scrape Pino. Upgrade path: pipe into a time-series store
 * keyed by `name` + `path`.
 *
 * Public + anonymous. Rate-limited via the global limiter.
 */

const WebVital = z
  .object({
    name: z.enum(['LCP', 'CLS', 'INP', 'FCP', 'TTFB', 'FID']),
    value: z.number(),
    delta: z.number().optional(),
    id: z.string().max(80),
    rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
    navigationType: z.string().max(40).optional(),
    path: z.string().max(400).optional(),
    timestamp: z.number().optional(),
  })
  .strict();

export async function metricsRoutes(app: FastifyInstance) {
  app.post('/web-vitals', async (request, reply) => {
    const parsed = WebVital.safeParse(request.body);
    if (!parsed.success) {
      // Intentionally 204 even on bad payloads — the client uses sendBeacon and can't
      // do anything with errors anyway. Drop noisy malformed requests silently.
      return reply.status(204).send();
    }
    const v = parsed.data;
    request.log.info(
      {
        metric: v.name,
        value: Math.round(v.value),
        rating: v.rating,
        path: v.path,
      },
      'web-vitals',
    );
    return ok(reply, { received: true });
  });
}
