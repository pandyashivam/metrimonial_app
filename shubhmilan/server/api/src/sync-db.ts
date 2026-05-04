/* eslint-disable no-console */
import { QueryTypes } from 'sequelize';

import { sequelize, shutdownDb } from './db.js';

/**
 * Sequelize's `alter: true` sync widens columns but does not drop pre-existing
 * indexes that conflict with the new shape. The Device.fcmToken column used
 * to carry a UNIQUE index over the full column; we now want a 191-char prefix
 * UNIQUE index instead (so the row fits MySQL's 3072-byte key limit under
 * utf8mb4). Drop any existing unique index over the full column first; sync()
 * will then re-create the prefix index from the model definition.
 *
 * Safe to re-run — if the index isn't there, the helper is a no-op.
 */
async function dropLegacyDeviceFcmIndex(): Promise<void> {
  // Skip if the table doesn't exist yet (fresh DB).
  const [tableExists] = (await sequelize.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices'`,
    { type: QueryTypes.SELECT },
  )) as Array<{ n: number }>;
  if (!tableExists || tableExists.n === 0) return;

  // Find UNIQUE indexes on `fcmToken` whose SUB_PART is NULL (full column).
  const rows = (await sequelize.query(
    `SELECT INDEX_NAME AS name FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'devices'
       AND COLUMN_NAME = 'fcmToken'
       AND NON_UNIQUE = 0
       AND SUB_PART IS NULL`,
    { type: QueryTypes.SELECT },
  )) as Array<{ name: string }>;

  for (const row of rows) {
    console.info(`Dropping legacy index devices.${row.name} (full-column UNIQUE on fcmToken)`);
    await sequelize.query(`ALTER TABLE \`devices\` DROP INDEX \`${row.name}\``);
  }
}

async function main() {
  // Don't call initDb() — it runs sync(), which is the very thing we need to
  // prepare the schema for. Authenticate, fix the legacy index, then sync.
  await sequelize.authenticate();
  console.info('Preparing schema for sync…');
  await dropLegacyDeviceFcmIndex();
  console.info('Syncing database schema (alter: true)…');
  await sequelize.sync({ alter: true });
  console.info('Schema sync complete.');
  await shutdownDb();
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
