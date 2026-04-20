/**
 * Typed env accessor. Synchronous for boot-time config (DATABASE_URL etc.);
 * async for runtime keys that can be pasted into /admin/apis.
 */
import { getSetting } from './settings';

type EnvKey =
  | 'APP_URL'
  | 'DATABASE_URL'
  | 'REDIS_URL'
  | 'BETTER_AUTH_SECRET'
  | 'BETTER_AUTH_URL'
  | 'DEEPSEEK_API_KEY'
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
  | 'RATE_LIMIT_PER_HOUR'
  | 'ADMIN_EMAILS'
  | 'SETTING_ENCRYPTION_KEY';

export function env(key: EnvKey): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key} — add it to .env`);
  return value;
}

export function envOptional(key: EnvKey): string | undefined {
  return process.env[key] || undefined;
}

export const appUrl = () => env('APP_URL');

/** Runtime key: prefers /admin/apis setting, falls back to .env. */
export async function runtimeKey(key: EnvKey): Promise<string> {
  const v = await getSetting(key);
  if (!v) throw new Error(`Missing ${key} — paste it in /admin/apis or set it in .env`);
  return v;
}

export async function runtimeKeyOptional(key: EnvKey): Promise<string | undefined> {
  return getSetting(key);
}
