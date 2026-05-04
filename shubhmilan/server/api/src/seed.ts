/* eslint-disable no-console */
import bcrypt from 'bcrypt';

import { initDb, shutdownDb, Plan, Profile, User } from './db.js';

interface SampleUser {
  email: string;
  phone: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  height: string;
  maritalStatus: 'NEVER_MARRIED' | 'DIVORCED' | 'WIDOWED' | 'AWAITING_DIVORCE';
  motherTongue: string;
  religion: string;
  caste: string;
  subCaste?: string;
  manglik?: 'NO' | 'YES' | 'ANSHIK' | 'UNKNOWN';
  education: string;
  occupation: string;
  income?: string;
  city: string;
  state: string;
  diet: 'VEGETARIAN' | 'NON_VEGETARIAN' | 'EGGETARIAN' | 'JAIN_VEGETARIAN' | 'VEGAN';
  aboutMe: string;
  hobbies: string[];
  languages: string[];
  personalityTraits: string[];
}

/**
 * Ten sample users covering a spread of cities, religions, mother tongues, and
 * professions so search/filter UX has something realistic to render in dev.
 */
const SAMPLE_USERS: SampleUser[] = [
  {
    email: 'aanya.sharma@example.com',
    phone: '+919810000001',
    fullName: 'Aanya Sharma',
    gender: 'FEMALE',
    age: 26,
    height: "5'4\"",
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Hindi',
    religion: 'Hindu',
    caste: 'Brahmin',
    manglik: 'NO',
    education: 'B.Tech (Computer Science), IIT Bombay',
    occupation: 'Software Engineer',
    income: '₹18-24 LPA',
    city: 'Mumbai',
    state: 'Maharashtra',
    diet: 'VEGETARIAN',
    aboutMe:
      "I'm a software engineer who unwinds with weekend trail runs and a stack of biographies. Family is everything; I make time for Sunday dinners no matter the deadline.",
    hobbies: ['Running', 'Reading', 'Cooking'],
    languages: ['Hindi', 'English', 'Marathi'],
    personalityTraits: ['Curious', 'Calm', 'Disciplined'],
  },
  {
    email: 'arjun.patel@example.com',
    phone: '+919810000002',
    fullName: 'Arjun Patel',
    gender: 'MALE',
    age: 29,
    height: "5'10\"",
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Gujarati',
    religion: 'Hindu',
    caste: 'Patel',
    manglik: 'NO',
    education: 'MBBS, AIIMS Delhi',
    occupation: 'Resident Doctor',
    income: '₹12-15 LPA',
    city: 'Ahmedabad',
    state: 'Gujarat',
    diet: 'VEGETARIAN',
    aboutMe:
      "Doctor by training, optimist by default. I love my profession because every day I get to help someone get back on their feet. Looking for a partner who values kindness and curiosity.",
    hobbies: ['Cricket', 'Travelling', 'Photography'],
    languages: ['Gujarati', 'Hindi', 'English'],
    personalityTraits: ['Empathetic', 'Hardworking', 'Adventurous'],
  },
  {
    email: 'priya.iyer@example.com',
    phone: '+919810000003',
    fullName: 'Priya Iyer',
    gender: 'FEMALE',
    age: 27,
    height: "5'3\"",
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Tamil',
    religion: 'Hindu',
    caste: 'Iyer',
    manglik: 'UNKNOWN',
    education: 'M.Sc. (Statistics), ISI Bangalore',
    occupation: 'Senior Product Manager',
    income: '₹26-32 LPA',
    city: 'Bangalore',
    state: 'Karnataka',
    diet: 'VEGETARIAN',
    aboutMe:
      'PM at a fintech startup. I read science fiction, hike the Western Ghats every long weekend, and learn one new dish a month. I value clear communication and a good sense of humour.',
    hobbies: ['Hiking', 'Cooking', 'Painting'],
    languages: ['Tamil', 'English', 'Kannada'],
    personalityTraits: ['Analytical', 'Warm', 'Independent'],
  },
  {
    email: 'rohan.mehta@example.com',
    phone: '+919810000004',
    fullName: 'Rohan Mehta',
    gender: 'MALE',
    age: 30,
    height: "5'11\"",
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Hindi',
    religion: 'Hindu',
    caste: 'Mehta',
    manglik: 'NO',
    education: 'LL.M., NLSIU Bangalore',
    occupation: 'Corporate Lawyer',
    income: '₹30-40 LPA',
    city: 'New Delhi',
    state: 'Delhi',
    diet: 'NON_VEGETARIAN',
    aboutMe:
      "Lawyer at a tier-one firm. Off the clock I'm at a chess club, on a tennis court, or watching old Hindi cinema. Honesty matters more to me than anything else.",
    hobbies: ['Chess', 'Tennis', 'Classic Hindi cinema'],
    languages: ['Hindi', 'English', 'Punjabi'],
    personalityTraits: ['Ambitious', 'Honest', 'Witty'],
  },
  {
    email: 'kavya.reddy@example.com',
    phone: '+919810000005',
    fullName: 'Kavya Reddy',
    gender: 'FEMALE',
    age: 25,
    height: "5'5\"",
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Telugu',
    religion: 'Hindu',
    caste: 'Reddy',
    manglik: 'UNKNOWN',
    education: 'B.Des., NID Ahmedabad',
    occupation: 'Senior UX Designer',
    income: '₹15-22 LPA',
    city: 'Hyderabad',
    state: 'Telangana',
    diet: 'NON_VEGETARIAN',
    aboutMe:
      'Designer at a health-tech company. I sketch every morning over filter coffee and play badminton most evenings. Family is small but very close.',
    hobbies: ['Sketching', 'Badminton', 'Bharatanatyam'],
    languages: ['Telugu', 'English', 'Hindi'],
    personalityTraits: ['Creative', 'Thoughtful', 'Cheerful'],
  },
  {
    email: 'aryan.khanna@example.com',
    phone: '+919810000006',
    fullName: 'Aryan Khanna',
    gender: 'MALE',
    age: 31,
    height: "6'0\"",
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Punjabi',
    religion: 'Hindu',
    caste: 'Khatri',
    manglik: 'ANSHIK',
    education: 'M.Arch., CEPT University',
    occupation: 'Practising Architect',
    income: '₹18-25 LPA',
    city: 'Chandigarh',
    state: 'Chandigarh',
    diet: 'NON_VEGETARIAN',
    aboutMe:
      "Architect with a soft spot for old cities and good biryani. I run a small studio with two friends. Looking for someone who's grounded, curious, and likes long walks.",
    hobbies: ['Travel', 'Cooking', 'Cycling'],
    languages: ['Punjabi', 'Hindi', 'English'],
    personalityTraits: ['Detail-oriented', 'Easy-going', 'Loyal'],
  },
  {
    email: 'saanvi.joshi@example.com',
    phone: '+919810000007',
    fullName: 'Saanvi Joshi',
    gender: 'FEMALE',
    age: 28,
    height: "5'2\"",
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Marathi',
    religion: 'Hindu',
    caste: 'Brahmin',
    subCaste: 'Deshastha',
    manglik: 'NO',
    education: 'Ph.D. (Machine Learning), IIT Delhi',
    occupation: 'Data Scientist',
    income: '₹35-45 LPA',
    city: 'Pune',
    state: 'Maharashtra',
    diet: 'VEGETARIAN',
    aboutMe:
      "Data scientist who's secretly a poet on weekends. Big believer in slow Sundays — books, tea, long phone calls with my parents. I'd love a partner who values quiet evenings.",
    hobbies: ['Reading', 'Yoga', 'Marathi theatre'],
    languages: ['Marathi', 'English', 'Hindi'],
    personalityTraits: ['Reflective', 'Driven', 'Soft-spoken'],
  },
  {
    email: 'vivaan.singh@example.com',
    phone: '+919810000008',
    fullName: 'Vivaan Singh',
    gender: 'MALE',
    age: 28,
    height: "5'9\"",
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Hindi',
    religion: 'Hindu',
    caste: 'Rajput',
    manglik: 'YES',
    education: 'PGDM (Marketing), IIM Lucknow',
    occupation: 'Brand Manager (FMCG)',
    income: '₹22-28 LPA',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    diet: 'NON_VEGETARIAN',
    aboutMe:
      "Brand manager by day, amateur tabla player by night. I'm the unofficial trip planner of every friend group. I'd like a partner with strong opinions and stronger loyalty.",
    hobbies: ['Tabla', 'Trekking', 'Food blogging'],
    languages: ['Hindi', 'English', 'Awadhi'],
    personalityTraits: ['Energetic', 'Sociable', 'Spontaneous'],
  },
  {
    email: 'ishita.banerjee@example.com',
    phone: '+919810000009',
    fullName: 'Ishita Banerjee',
    gender: 'FEMALE',
    age: 26,
    height: "5'4\"",
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Bengali',
    religion: 'Hindu',
    caste: 'Brahmin',
    subCaste: 'Bengali',
    manglik: 'NO',
    education: 'M.A. (English Literature), Jadavpur University',
    occupation: 'Senior Journalist',
    income: '₹10-14 LPA',
    city: 'Kolkata',
    state: 'West Bengal',
    diet: 'NON_VEGETARIAN',
    aboutMe:
      'I write features on culture and politics. I love rainy afternoons, second-hand bookshops, and playing chess very badly. Looking for a kind, well-read partner.',
    hobbies: ['Writing', 'Chess', 'Indian classical music'],
    languages: ['Bengali', 'English', 'Hindi'],
    personalityTraits: ['Curious', 'Articulate', 'Compassionate'],
  },
  {
    email: 'aditya.nair@example.com',
    phone: '+919810000010',
    fullName: 'Aditya Nair',
    gender: 'MALE',
    age: 30,
    height: "5'10\"",
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Malayalam',
    religion: 'Hindu',
    caste: 'Nair',
    manglik: 'NO',
    education: 'IAS, JNU (M.A. Economics)',
    occupation: 'Civil Servant (IAS)',
    income: '₹14-18 LPA',
    city: 'Kochi',
    state: 'Kerala',
    diet: 'NON_VEGETARIAN',
    aboutMe:
      "Public servant trying to do right by the place I serve. I run, swim, and read history. I'd like to build a life with someone who shares a sense of duty and a sense of humour.",
    hobbies: ['Running', 'Swimming', 'Reading history'],
    languages: ['Malayalam', 'English', 'Hindi', 'Tamil'],
    personalityTraits: ['Principled', 'Steady', 'Curious'],
  },
];

const DEFAULT_PASSWORD = 'Test@1234';

function dobFromAge(age: number): Date {
  const now = new Date();
  // Anchor everyone to the same birthday so the seed is deterministic.
  return new Date(now.getFullYear() - age, 5, 15);
}

async function seed() {
  await initDb();
  console.info('Seeding database…');

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
      console.info(`  Plan: ${plan.name}`);
    } else {
      console.info(`  Plan exists: ${plan.name}`);
    }
  }

  const adminEmail = 'admin@shubhmilan.com';
  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await User.create({
      email: adminEmail,
      phone: '+919999999999',
      passwordHash: await bcrypt.hash('Admin@123', 12),
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    });
    console.info('  Admin: admin@shubhmilan.com / Admin@123');
  } else {
    console.info('  Admin exists');
  }

  const sharedHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  let created = 0;
  let skipped = 0;

  for (const u of SAMPLE_USERS) {
    const existing = await User.findOne({ where: { email: u.email } });
    if (existing) {
      skipped++;
      continue;
    }
    const user = await User.create({
      email: u.email,
      phone: u.phone,
      passwordHash: sharedHash,
      role: 'USER',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    });
    await Profile.create({
      userId: user.id,
      fullName: u.fullName,
      gender: u.gender,
      dob: dobFromAge(u.age),
      height: u.height,
      maritalStatus: u.maritalStatus,
      motherTongue: u.motherTongue,
      religion: u.religion,
      caste: u.caste,
      subCaste: u.subCaste ?? null,
      manglik: u.manglik ?? 'UNKNOWN',
      education: u.education,
      occupation: u.occupation,
      income: u.income ?? null,
      city: u.city,
      state: u.state,
      country: 'India',
      diet: u.diet,
      smoking: 'NO',
      drinking: 'NO',
      aboutMe: u.aboutMe,
      familyValues: 'MODERATE',
      personalityTraits: u.personalityTraits,
      hobbies: u.hobbies,
      languages: u.languages,
    });
    created++;
    console.info(`  User: ${u.fullName} (${u.email})`);
  }

  console.info(`Seed complete. Sample users created: ${created}, already-present skipped: ${skipped}.`);
  console.info(`Sample login → email: any of the addresses above, password: ${DEFAULT_PASSWORD}`);
  await shutdownDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
