import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { Profile } from '../db.js';
import { fail, ok } from '../lib/response.js';
import {
  improveAboutMe,
  geminiEnabled,
  suggestTraits,
  upsertProfileEmbedding,
} from '../services/gemini.js';

const ImproveInput = z.object({ aboutMe: z.string().min(20).max(2000) }).strict();

export async function aiRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/status', async (_req, reply) => ok(reply, { enabled: geminiEnabled() }));

  app.post('/improve-about', async (request, reply) => {
    if (!geminiEnabled()) return fail(reply, 503, 'AI_DISABLED', 'Gemini not configured');
    const parsed = ImproveInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const improved = await improveAboutMe(parsed.data.aboutMe);
    if (!improved) return fail(reply, 502, 'UPSTREAM', 'Gemini returned no content');
    return ok(reply, { improved });
  });

  app.post('/suggest-traits', async (request, reply) => {
    if (!geminiEnabled()) return fail(reply, 503, 'AI_DISABLED', 'Gemini not configured');
    const parsed = ImproveInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const out = await suggestTraits(parsed.data.aboutMe);
    if (!out) return fail(reply, 502, 'UPSTREAM', 'Gemini returned no content');
    return ok(reply, out);
  });

  app.post('/reindex-self', async (request, reply) => {
    if (!geminiEnabled()) return fail(reply, 503, 'AI_DISABLED', 'Gemini not configured');
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const vec = await upsertProfileEmbedding(request.profileId);
    return ok(reply, { indexed: !!vec, dimension: vec?.length ?? 0 });
  });

  const CoachInput = z.object({ question: z.string().min(1).max(500) }).strict();
  app.post('/coach', async (request, reply) => {
    if (!geminiEnabled()) return fail(reply, 503, 'AI_DISABLED', 'Gemini not configured');
    const parsed = CoachInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { env } = await import('../env.js');
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

    const profile = request.profileId
      ? await Profile.findByPk(request.profileId, {
          attributes: ['fullName', 'aboutMe', 'city', 'religion'],
        })
      : null;

    const systemPrompt =
      'You are ShubhMilan coach — help the user craft a respectful, authentic matrimonial profile. ' +
      'Be concise. Avoid generic platitudes. Suggest concrete wording.';

    const contextParts: string[] = [];
    if (profile) {
      contextParts.push(`Context about me: ${JSON.stringify({
        fullName: profile.fullName,
        aboutMe: profile.aboutMe,
        city: profile.city,
        religion: profile.religion,
      })}`);
    }
    contextParts.push(parsed.data.question);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: contextParts.map((text) => ({ text })) }],
      systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.5, maxOutputTokens: 400 },
    });
    const text = result.response.text();
    return ok(reply, { reply: text });
  });
}
