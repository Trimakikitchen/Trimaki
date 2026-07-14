import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_BUCKET_NAME: z.string().default('trimaki-assets'),
  JWT_SECRET: z.string().min(32).default('trimaki_jwt_secret_change_me_in_prod_32chars'),
  JWT_REFRESH_SECRET: z.string().min(32).default('trimaki_jwt_refresh_secret_change_me_32chars'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_placeholder'),
  RAZORPAY_KEY_SECRET: z.string().default('placeholder_razorpay_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().default('re_placeholder_resend_key'),
  FROM_EMAIL: z.string().email().default('orders@trimaki.com'),
  TWILIO_ACCOUNT_SID: z.string().default('AC_placeholder_twilio_sid'),
  TWILIO_AUTH_TOKEN: z.string().default('placeholder_twilio_token'),
  TWILIO_PHONE_NUMBER: z.string().default('+10000000000'),
  GOOGLE_MAPS_API_KEY: z.string().default('placeholder_google_maps_key'),
  GOOGLE_CLIENT_ID: z.string().default('your-google-client-id.apps.googleusercontent.com'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
