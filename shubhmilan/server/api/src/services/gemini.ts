import { createHash } from 'node:crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

import {
  sequelize,
  ProfileEmbedding,
  Profile,
} from '../db.js';
import { env } from '../env.js';

let cachedClient: GoogleGenerativeAI | null = null;
function client(): GoogleGenerativeAI | null {
  if (!env.GEMINI_API_KEY) return null;
  if (!cachedClient) cachedClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return cachedClient;
}

export function geminiEnabled(): boolean {
  return !!env.GEMINI_API_KEY;
}

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

export async function upsertProfileEmbedding(profileId: string): Promise<number[] | null> {
  const profile = await Profile.findByPk(profileId, {
    attributes: ['id', 'aboutMe', 'personalityTraits', 'hobbies'],
  });
  if (!profile) return null;

  const source = [
    profile.aboutMe,
    (profile.personalityTraits as string[] | null)?.join(', '),
    (profile.hobbies as string[] | null)?.join(', '),
  ]
    .filter(Boolean)
    .join('\n');
  if (!source || source.length < 10) return null;

  const hash = hashText(source);
  const existing = await ProfileEmbedding.findOne({ where: { profileId } });
  if (existing && existing.sourceHash === hash) {
    return bufferToFloats(existing.vector);
  }

  const c = client();
  if (!c) return null;

  const model = c.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });
  const res = await model.embedContent(source);
  const vec = res.embedding?.values ?? [];
  if (!vec.length) return null;

  if (existing) {
    await existing.update({
      model: env.GEMINI_EMBEDDING_MODEL,
      dimension: vec.length,
      vector: floatsToBuffer(vec),
      sourceHash: hash,
      computedAt: new Date(),
    });
  } else {
    await ProfileEmbedding.create({
      profileId,
      model: env.GEMINI_EMBEDDING_MODEL,
      dimension: vec.length,
      vector: floatsToBuffer(vec),
      sourceHash: hash,
    });
  }

  return vec;
}

export async function getEmbedding(profileId: string): Promise<number[] | null> {
  const row = await ProfileEmbedding.findOne({ where: { profileId } });
  if (!row) return null;
  return bufferToFloats(row.vector);
}

export async function improveAboutMe(aboutMe: string): Promise<string | null> {
  const c = client();
  if (!c) return null;
  const model = c.getGenerativeModel({ model: env.GEMINI_MODEL });
  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'You are ShubhMilan, a respectful matrimonial assistant for Indian families. ' +
              'Rewrite the following "about me" paragraph to be warm, family-friendly, authentic, and ' +
              'between 60-120 words. Preserve factual content (city, profession, hobbies). ' +
              'Do not invent new facts. Do not include headings or markdown — return a single paragraph.\n\n' +
              aboutMe,
          },
        ],
      },
    ],
  });
  return result.response?.text()?.trim() ?? null;
}

export async function suggestTraits(
  aboutMe: string,
): Promise<{ personality: string[]; hobbies: string[] } | null> {
  const c = client();
  if (!c) return null;
  const model = c.getGenerativeModel({
    model: env.GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'Extract up to 6 personality traits and up to 6 hobbies from the given bio. ' +
              'Return a strict JSON object: {"personality": [..], "hobbies": [..]}. ' +
              'Use Title Case. Do not invent traits that are not clearly supported by the text.\n\n' +
              aboutMe,
          },
        ],
      },
    ],
  });
  const raw = result.response?.text() ?? '{}';
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
