import { z } from 'zod';

/**
 * Environment schema. Validated once at boot; a malformed env aborts startup
 * with a readable error instead of failing deep inside a request.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('api/v1'),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2592000),

  ADAPTER_MODE: z.enum(['local', 'cloud']).default('local'),
  LOCAL_STORAGE_DIR: z.string().default('./storage'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:4000'),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  THROTTLE_TTL: z.coerce.number().int().positive().default(10),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),

  // Cloud providers — optional unless ADAPTER_MODE=cloud (checked by adapters at use).
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('refiqo'),
  FCM_PROJECT_ID: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  LINKEDIN_OAUTH_CLIENT_ID: z.string().optional(),
  GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
