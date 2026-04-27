/* eslint-disable no-console */
import { initDb, shutdownDb, Plan, User } from './db.js';
import bcrypt from 'bcrypt';

async function seed() {
  await initDb();
  console.info('Seeding database...');

  const defaultPlans = [
    { name: 'Free', priceInr: 0, durationDays: 365, features: ['Browse profiles', '5 interests/month'], active: true },
    { name: 'Silver', priceInr: 49900, durationDays: 90, features: ['Browse profiles', '30 interests/month', 'See who viewed'], active: true },
    { name: 'Gold', priceInr: 99900, durationDays: 180, features: ['Unlimited interests', 'See who viewed', 'Chat before match', 'Priority support'], active: true },
    { name: 'Platinum', priceInr: 199900, durationDays: 365, features: ['All Gold features', 'Free background check', 'Dedicated relationship manager'], active: true },
  ];

  for (const plan of defaultPlans) {
    const existing = await Plan.findOne({ where: { name: plan.name } });
    if (!existing) {
      await Plan.create(plan);
      console.info(`  Created plan: ${plan.name}`);
    } else {
      console.info(`  Plan already exists: ${plan.name}`);
    }
  }

  const adminEmail = 'admin@shubhmilan.com';
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hash = await bcrypt.hash('Admin@123', 12);
    await User.create({
      email: adminEmail,
      phone: '+919999999999',
      passwordHash: hash,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    });
    console.info('  Created admin user: admin@shubhmilan.com / Admin@123');
  } else {
    console.info('  Admin user already exists');
  }

  console.info('Seed complete.');
  await shutdownDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
