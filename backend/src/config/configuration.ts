import { Env } from './env.validation';

/**
 * Typed, namespaced view of the validated env. Inject via `ConfigService`
 * and read with `config.get('jwt.accessSecret')` etc.
 */
export const configuration = (env: Env) => ({
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  isProd: env.NODE_ENV === 'production',

  database: {
    url: env.DATABASE_URL,
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshTtl: env.JWT_REFRESH_TTL,
  },

  adapters: {
    mode: env.ADAPTER_MODE,
    localStorageDir: env.LOCAL_STORAGE_DIR,
    publicBaseUrl: env.PUBLIC_BASE_URL,
  },

  cors: {
    origins: env.CORS_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  throttle: {
    ttl: env.THROTTLE_TTL,
    limit: env.THROTTLE_LIMIT,
  },

  supabase: {
    url: env.SUPABASE_URL,
    serviceKey: env.SUPABASE_SERVICE_KEY,
    bucket: env.SUPABASE_STORAGE_BUCKET,
  },

  fcm: {
    projectId: env.FCM_PROJECT_ID,
    clientEmail: env.FCM_CLIENT_EMAIL,
    privateKey: env.FCM_PRIVATE_KEY,
  },

  oauth: {
    googleClientId: env.GOOGLE_OAUTH_CLIENT_ID,
    linkedinClientId: env.LINKEDIN_OAUTH_CLIENT_ID,
    githubClientId: env.GITHUB_OAUTH_CLIENT_ID,
  },
});

export type AppConfig = ReturnType<typeof configuration>;
