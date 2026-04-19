import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { fail } from '../lib/response.js';
import { getMaintenanceMode } from '../services/settings.js';

const ALLOW_PATHS = new Set([
  '/health',
  '/api/v1/admin', // prefix allow so admins can still toggle the flag
  '/api/v1/auth/login',
]);

function isAllowedPath(url: string): boolean {
  if (ALLOW_PATHS.has(url)) return true;
  for (const p of ALLOW_PATHS) {
    if (url.startsWith(p + '/') || url === p) return true;
  }
  return false;
}

/**
 * Global kill-switch. When `feature.maintenance.enabled` is true in the Setting table,
 * every non-admin, non-auth request is rejected with 503. Admins continue unaffected so
 * they can flip the flag off. Webhooks fall under admin-bypass by design — we can't
 * afford to lose Razorpay captures while we're patching.
 */
export const maintenancePlugin = fp(async (app: FastifyInstance) => {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (isAllowedPath(request.url)) return;
    if (request.url.startsWith('/api/v1/auth/')) return; // always allow auth flows
    if (request.url.startsWith('/api/v1/webhook') || request.url.endsWith('/webhook')) return;

    const m = await getMaintenanceMode();
    if (!m.enabled) return;

    // Admin bypass — via explicit allowlist or any ADMIN/SUPERADMIN role embedded in the
    // access token (claims are decoded by the authPlugin but we can't rely on that here
    // because onRequest fires before preHandler). Cheapest bypass: allow-by-allowlist only.
    if (m.allowUserIds?.length) {
      const header = request.headers.authorization;
      if (header?.startsWith('Bearer ')) {
        // Lazy import to avoid cycles.
        const { verifyAccessToken } = await import('../lib/tokens.js');
        try {
          const claims = verifyAccessToken(header.slice(7));
          if (m.allowUserIds.includes(claims.sub)) return;
          if (claims.role === 'ADMIN' || claims.role === 'SUPERADMIN') return;
        } catch {
          /* fallthrough to 503 */
        }
      }
    }

    return fail(reply, 503, 'MAINTENANCE', m.message);
  });
});
