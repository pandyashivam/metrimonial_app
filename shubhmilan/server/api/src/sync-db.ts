/* eslint-disable no-console */
import { initDb, shutdownDb, sequelize } from './db.js';

async function main() {
  await initDb();
  console.info('Syncing database schema (alter: true)...');
  await sequelize.sync({ alter: true });
  console.info('Schema sync complete.');
  await shutdownDb();
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
