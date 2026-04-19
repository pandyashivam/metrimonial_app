import type { FastifyInstance } from 'fastify';

import { prisma } from '../db.js';
import { ok } from '../lib/response.js';

export async function planRoutes(app: FastifyInstance) {
  app.get('/', async (_request, reply) => {
    const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { priceInr: 'asc' } });
    return ok(reply, plans);
  });
}
