/**
 * Runtime-configurable settings store.
 *
 * Admins paste API keys into /admin/apis. They're written here. Feature code
 * reads via getSetting(); if missing, falls back to process.env. This means
 * the app works both ways — keys in .env at boot, OR pasted in the UI.
 *
 * Values are encrypted-at-rest when SETTING_ENCRYPTION_KEY is set
 * (AES-256-GCM, 32-byte base64 key). Without that env var we store plain.
 */
import crypto from 'node:crypto';
import { prisma } from './db';

const ALGO = 'aes-256-gcm';

function key(): Buffer | null {
  const raw = process.env.SETTING_ENCRYPTION_KEY;
  if (!raw) return null;
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) return null;
  return buf;
}

function encrypt(plain: string): string | null {
  const k = key();
  if (!k) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, k, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(cipherText: string): string {
  const k = key();
  if (!k) return cipherText;
  const buf = Buffer.from(cipherText, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, k, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

/** Read a setting. Falls back to process.env if not in DB. */
export async function getSetting(key: string): Promise<string | undefined> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) return process.env[key] || undefined;
  return row.encrypted ? decrypt(row.value) : row.value;
}

/** Same as getSetting but throws if absent. For required API keys. */
export async function requireSetting(key: string): Promise<string> {
  const v = await getSetting(key);
  if (!v) throw new Error(`Missing ${key} — set it in /admin/apis or .env`);
  return v;
}

export async function setSetting(key: string, value: string, updatedBy?: string) {
  const k = process.env.SETTING_ENCRYPTION_KEY ? key : null; // referenced only to avoid unused warning
  void k;
  const encKey = process.env.SETTING_ENCRYPTION_KEY ? Buffer.from(process.env.SETTING_ENCRYPTION_KEY, 'base64') : null;
  const useEnc = !!encKey && encKey.length === 32;
  const encoded = useEnc ? encrypt(value)! : value;
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: encoded, encrypted: useEnc, updatedBy },
    update: { value: encoded, encrypted: useEnc, updatedBy },
  });
}

export async function clearSetting(key: string) {
  await prisma.setting.delete({ where: { key } }).catch(() => null);
}
