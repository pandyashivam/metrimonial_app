import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  WEB_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_PUBLIC_URL: z.string().url().default('http://localhost:3001'),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_NAME: z.string().default('shubhmilan'),
  DB_USER: z.string().default('root'),
  DB_PASS: z.string().default(''),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  PII_ENCRYPTION_KEY: z.string().min(32),

  AWS_S3_REGION: z.string().default('ap-south-1'),
  AWS_S3_ACCESS_KEY_ID: z.string().default(''),
  AWS_S3_SECRET_ACCESS_KEY: z.string().default(''),
  AWS_S3_BUCKET: z.string().default('shubhmilan-photos'),
  AWS_S3_PUBLIC_URL: z.string().default(''),

  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),

  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  GEMINI_EMBEDDING_MODEL: z.string().default('text-embedding-004'),

  EMAIL_FROM: z.string().default('noreply@shubhmilan.local'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_SECURE: z.coerce.boolean().default(false),

  MSG91_AUTH_KEY: z.string().default(''),
  MSG91_SENDER_ID: z.string().default('SHBMLN'),
  MSG91_TEMPLATE_ID: z.string().default(''),
  TWILIO_ACCOUNT_SID: z.string().default(''),
  TWILIO_AUTH_TOKEN: z.string().default(''),
  TWILIO_FROM: z.string().default(''),

  EXPO_ACCESS_TOKEN: z.string().default(''),

  DIGIO_CLIENT_ID: z.string().default(''),
  DIGIO_CLIENT_SECRET: z.string().default(''),
  DIGIO_BASE_URL: z.string().default('https://ext.digio.in:444'),
  HYPERVERGE_APP_ID: z.string().default(''),
  HYPERVERGE_APP_KEY: z.string().default(''),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
