/* eslint-disable no-console */
import { initDb, shutdownDb } from '../db.js';
import { runNightlyMatchPrecompute } from '../services/matching.js';

async function main() {
  await initDb();
  const started = Date.now();
  console.info('Match precompute starting...');
  try {
    const result = await runNightlyMatchPrecompute({ batchSize: 25, take: 50 });
    const elapsedMs = Date.now() - started;
    console.info(
      `Precompute done - ${result.processed}/${result.total} profiles in ${(elapsedMs / 1000).toFixed(1)}s`,
    );
  } catch (err) {
    console.error('Precompute failed', err);
    process.exitCode = 1;
  } finally {
    await shutdownDb();
  }
}

void main();
