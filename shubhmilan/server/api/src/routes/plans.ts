import type { FastifyInstance } from 'fastify';

import { Plan } from '../db.js';
import { ok } from '../lib/response.js';

export async function planRoutes(app: FastifyInstance) {
  app.get('/', async (_request, reply) => {
    const plans = await Plan.findAll({ where: { active: true }, order: [['priceInr', 'ASC']] });
    return ok(reply, plans);
  });
}
