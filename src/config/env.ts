/**
 * Environment Configuration
 * Type-safe access to environment variables
 */

import { z } from 'zod';

/**
 * Environment variable schema
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_PROVIDER: z.enum(['local', 'supabase']).default('local'),

  // Supabase (optional for local dev)
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Google Sheets
  GOOGLE_SHEETS_CLIENT_ID: z.string().optional(),
  GOOGLE_SHEETS_CLIENT_SECRET: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_AGENCY_PRICE_ID: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('FlowForm'),

  // Analytics (optional)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),

  // Error tracking (optional)
  SENTRY_DSN: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 */
function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);

    // In development, continue with warnings
    // In production, fail hard
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables');
    }

    // Return partial env for development
    return process.env as unknown as Env;
  }

  return parsed.data;
}

/**
 * Environment configuration singleton
 */
export const env = parseEnv();

/**
 * Feature flags based on environment
 */
export const features = {
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',

  // Check if specific features are configured
  hasGoogleAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  hasGoogleSheets: !!(
    env.GOOGLE_SHEETS_CLIENT_ID && env.GOOGLE_SHEETS_CLIENT_SECRET
  ),
  hasStripe: !!env.STRIPE_SECRET_KEY,
  hasAnalytics: !!env.NEXT_PUBLIC_POSTHOG_KEY,
  hasErrorTracking: !!env.SENTRY_DSN,
  isUsingSupabase: env.DB_PROVIDER === 'supabase',
};
