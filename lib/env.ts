/**
 * Typed env accessor. Throws a descriptive error at call time so missing
 * keys surface in logs/responses rather than causing silent undefined reads.
 */

type EnvKey =
  | 'APP_URL'
  | 'DATABASE_URL'
  | 'REDIS_URL'
  | 'BETTER_AUTH_SECRET'
  | 'BETTER_AUTH_URL'
  | 'OLLAMA_URL'
  | 'OLLAMA_MODEL'
  | 'STRIPE_SECRET_KEY'
  | 'STRIPE_WEBHOOK_SECRET'
  | 'STRIPE_PRICE_BASIC'
  | 'STRIPE_PRICE_PRO'
  | 'STRIPE_PRICE_TEAM'
  | 'RESEND_API_KEY'
  | 'RESEND_FROM_EMAIL'
  | 'RENTCAST_API_KEY'
  | 'CENSUS_API_KEY'
  | 'GREATSCHOOLS_API_KEY'
  | 'MINIO_ENDPOINT'
  | 'MINIO_PORT'
  | 'MINIO_ROOT_USER'
  | 'MINIO_ROOT_PASSWORD'
  | 'MINIO_BUCKET'
  | 'MINIO_USE_SSL'
  | 'MINIO_PUBLIC_URL'
  | 'RATE_LIMIT_PER_HOUR';

export function env(key: EnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} — add it to .env`);
  }
  return value;
}

export function envOptional(key: EnvKey): string | undefined {
  return process.env[key] || undefined;
}

export const appUrl = () => env('APP_URL');
