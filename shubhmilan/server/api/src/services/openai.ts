/* eslint-disable no-console */
import { createHash } from 'node:crypto';
import OpenAI from 'openai';

import { prisma } from '../db.js';
import { env } from '../env.js';

let cachedClient: OpenAI | null = null;
function client(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;
  if (!cachedClient) cachedClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return cachedClient;
}

export function openaiEnabled(): boolean {
  return !!env.OPENAI_API_KEY;
}

/** Pack a number[] as a float32 little-endian Buffer. */
function floatsToBuffer(nums: number[]): Buffer {
  const buf = Buffer.allocUnsafe(nums.length * 4);
  for (let i = 0; i < nums.length; i++) buf.writeFloatLE(nums[i] ?? 0, i * 4);
  return buf;
}

function bufferToFloats(buf: Buffer): number[] {
  const len = buf.byteLength / 4;
  const out = new Array<number>(len);
  for (let i = 0; i < len; i++) out[i] = buf.readFloatLE(i * 4);
  return out;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0,
      bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Idempotent: computes + caches an embedding for a profile's aboutMe. Returns the vector if the
 * OpenAI key is configured; otherwise returns null (callers fall back to heuristic matching).
 */
export async function upsertProfileEmbedding(profileId: string): Promise<number[] | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { id: true, aboutMe: true, personalityTraits: true, hobbies: true },
  });
  if (!profile) return null;

  const source = [
    profile.aboutMe,
    (profile.personalityTraits as unknown as string[] | null)?.join(', '),
    (profile.hobbies as unknown as string[] | null)?.join(', '),
  ]
    .filter(Boolean)
    .join('\n');
  if (!source || source.length < 10) return null;

  const hash = hashText(source);
  const existing = await prisma.profileEmbedding.findUnique({ where: { profileId } });
  if (existing && existing.sourceHash === hash) {
    return bufferToFloats(existing.vector as unknown as Buffer);
  }

  const c = client();
  if (!c) return null;

  const res = await c.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: source,
  });
  const vec = res.data[0]?.embedding ?? [];
  if (!vec.length) return null;

  await prisma.profileEmbedding.upsert({
    where: { profileId },
    update: {
      model: env.OPENAI_EMBEDDING_MODEL,
      dimension: vec.length,
      vector: floatsToBuffer(vec),
      sourceHash: hash,
      computedAt: new Date(),
    },
    create: {
      profileId,
      model: env.OPENAI_EMBEDDING_MODEL,
      dimension: vec.length,
      vector: floatsToBuffer(vec),
      sourceHash: hash,
    },
  });

  return vec;
}

export async function getEmbedding(profileId: string): Promise<number[] | null> {
  const row = await prisma.profileEmbedding.findUnique({ where: { profileId } });
  if (!row) return null;
  return bufferToFloats(row.vector as unknown as Buffer);
}

/**
 * Rewrite an aboutMe paragraph to be warmer and more respectful. Returns null when OpenAI is
 * not configured; callers surface "feature unavailable" to the user in that case.
 */
export async function improveAboutMe(aboutMe: string): Promise<string | null> {
  const c = client();
  if (!c) return null;
  const res = await c.chat.completions.create({
    model: env.OPENAI_CHAT_MODEL,
    temperature: 0.7,
    max_tokens: 400,
    messages: [
      {
        role: 'system',
        content:
          'You are ShubhMilan, a respectful matrimonial assistant for Indian families. ' +
          'Rewrite the user\'s "about me" paragraph to be warm, family-friendly, authentic, and ' +
          'between 60-120 words. Preserve factual content (city, profession, hobbies). ' +
          'Do not invent new facts. Do not include headings or markdown — return a single paragraph.',
      },
      { role: 'user', content: aboutMe },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? null;
}

export async function suggestTraits(
  aboutMe: string,
): Promise<{ personality: string[]; hobbies: string[] } | null> {
  const c = client();
  if (!c) return null;
  const res = await c.chat.completions.create({
    model: env.OPENAI_CHAT_MODEL,
    temperature: 0.2,
    max_tokens: 200,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Extract up to 6 personality traits and up to 6 hobbies from the given bio. ' +
          'Return a strict JSON object: {"personality": [..], "hobbies": [..]}. ' +
          'Use Title Case. Do not invent traits that are not clearly supported by the text.',
      },
      { role: 'user', content: aboutMe },
    ],
  });
  const raw = res.choices[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(raw) as { personality?: string[]; hobbies?: string[] };
    return {
      personality: (parsed.personality ?? []).slice(0, 6).map(String),
      hobbies: (parsed.hobbies ?? []).slice(0, 6).map(String),
    };
  } catch {
    return null;
  }
}
