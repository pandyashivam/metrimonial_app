import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';
import {
  improveAboutMe,
  openaiEnabled,
  suggestTraits,
  upsertProfileEmbedding,
} from '../services/openai.js';

const ImproveInput = z.object({ aboutMe: z.string().min(20).max(2000) }).strict();

/**
 * AI endpoints. All calls go server-side — the OpenAI key is never exposed to clients.
 * Every endpoint returns a deterministic error when OPENAI_API_KEY isn't set so UIs can
 * show a "feature unavailable" state instead of crashing.
 */
export async function aiRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/status', async (_req, reply) => ok(reply, { enabled: openaiEnabled() }));

  // Rewrite aboutMe.
  app.post('/improve-about', async (request, reply) => {
    if (!openaiEnabled()) return fail(reply, 503, 'AI_DISABLED', 'OpenAI not configured');
    const parsed = ImproveInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const improved = await improveAboutMe(parsed.data.aboutMe);
    if (!improved) return fail(reply, 502, 'UPSTREAM', 'OpenAI returned no content');
    return ok(reply, { improved });
  });

  // Suggest traits + hobbies from a bio.
  app.post('/suggest-traits', async (request, reply) => {
    if (!openaiEnabled()) return fail(reply, 503, 'AI_DISABLED', 'OpenAI not configured');
    const parsed = ImproveInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const out = await suggestTraits(parsed.data.aboutMe);
    if (!out) return fail(reply, 502, 'UPSTREAM', 'OpenAI returned no content');
    return ok(reply, out);
  });

  // Trigger an embedding refresh (also runs nightly).
  app.post('/reindex-self', async (request, reply) => {
    if (!openaiEnabled()) return fail(reply, 503, 'AI_DISABLED', 'OpenAI not configured');
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const vec = await upsertProfileEmbedding(request.profileId);
    return ok(reply, { indexed: !!vec, dimension: vec?.length ?? 0 });
  });

  // Conversational profile coach (short bounded usage).
  const CoachInput = z.object({ question: z.string().min(1).max(500) }).strict();
  app.post('/coach', async (request, reply) => {
    if (!openaiEnabled()) return fail(reply, 503, 'AI_DISABLED', 'OpenAI not configured');
    const parsed = CoachInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');

    // Lazily import to avoid bundling OpenAI into routes that don't use it.
    const { default: OpenAI } = await import('openai');
    const { env } = await import('../env.js');
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const profile = request.profileId
      ? await prisma.profile.findUnique({
          where: { id: request.profileId },
          select: { fullName: true, aboutMe: true, city: true, religion: true },
        })
      : null;

    const res = await client.chat.completions.create({
      model: env.OPENAI_CHAT_MODEL,
      temperature: 0.5,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content:
            'You are ShubhMilan coach — help the user craft a respectful, authentic matrimonial profile. ' +
            'Be concise. Avoid generic platitudes. Suggest concrete wording.',
        },
        ...(profile
          ? [
              {
                role: 'user' as const,
                content: `Context about me: ${JSON.stringify(profile)}`,
              },
            ]
          : []),
        { role: 'user', content: parsed.data.question },
      ],
    });
    return ok(reply, { reply: res.choices[0]?.message?.content ?? '' });
  });
}
