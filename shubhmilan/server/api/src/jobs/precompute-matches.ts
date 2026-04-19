/* eslint-disable no-console */
/**
 * Nightly match-score precompute sweep.
 *
 * Run via:
 *   pnpm --filter @shubhmilan/api precompute:matches
 *
 * Schedule (production):
 *   - Railway / Fly.io: cron `0 3 * * *` (3am IST by adjusting TZ)
 *   - Kubernetes: CronJob pointing at the same entrypoint
 *   - Docker: host-level cron `docker exec shubhmilan-api node dist/jobs/precompute-matches.js`
 *
 * Exits non-zero on failure so cron systems can alert.
 */

import { shutdownDb } from '../db.js';
import { runNightlyMatchPrecompute } from '../services/matching.js';

async function main() {
  const started = Date.now();
  console.info('🧮 Match precompute starting…');
  try {
    const result = await runNightlyMatchPrecompute({ batchSize: 25, take: 50 });
    const elapsedMs = Date.now() - started;
    console.info(
      `✅ Precompute done — ${result.processed}/${result.total} profiles in ${(elapsedMs / 1000).toFixed(1)}s`,
    );
  } catch (err) {
    console.error('❌ Precompute failed', err);
    process.exitCode = 1;
  } finally {
    await shutdownDb();
  }
}

void main();
