/**
 * Shared helpers for Fastify integration tests.
 *
 * These tests need a real MySQL to run against. In CI, the workflow at .github/workflows/ci.yml
 * spins up a MySQL service. Locally: `pnpm db:up && pnpm db:migrate` first, then
 * `pnpm --filter @shubhmilan/api test`.
 *
 * The helpers below reset the shared test database before each run by truncating every table
 * in FK-safe order. They do NOT drop the schema — that would defeat the prisma migration.
 */

import { PrismaClient } from '@prisma/client';

import { buildApp } from '../../src/app.js';

let cachedApp: Awaited<ReturnType<typeof buildApp>> | null = null;

export async function getApp() {
  if (cachedApp) return cachedApp;
  cachedApp = await buildApp();
  await cachedApp.ready();
  return cachedApp;
}

export const testPrisma = new PrismaClient();

export async function resetDatabase() {
  // FK-safe order. TRUNCATE is fast but MySQL needs FK_CHECKS disabled for cascades.
  await testPrisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  const tables: string[] = [
    'MatchLog',
    'ProfileEmbedding',
    'AdminLog',
    'Device',
    'Otp',
    'Subscription',
    'Plan',
    'MatchScore',
    'Message',
    'Conversation',
    'ProfileView',
    'Report',
    'Block',
    'Shortlist',
    'Interest',
    'Verification',
    'Photo',
    'PartnerPreference',
    'Horoscope',
    'Family',
    'Profile',
    'RefreshToken',
    'User',
  ];
  for (const t of tables) {
    await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE \`${t}\``).catch(() => null);
  }
  await testPrisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
}

export async function closeEverything() {
  await cachedApp?.close();
  cachedApp = null;
  await testPrisma.$disconnect();
}

/** Inject helper that returns { status, body } (body parsed as JSON when possible). */
export async function inject(opts: {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  accessToken?: string;
}) {
  const app = await getApp();
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.accessToken) headers.authorization = `Bearer ${opts.accessToken}`;
  const res = await app.inject({
    method: opts.method,
    url: opts.url,
    headers,
    payload: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let body: unknown;
  try {
    body = JSON.parse(res.body);
  } catch {
    body = res.body;
  }
  return { status: res.statusCode, body: body as { ok: boolean; data?: unknown; error?: { code: string; message: string } } };
}
