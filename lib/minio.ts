import { Client as MinioClient } from 'minio';
import { randomUUID } from 'node:crypto';
import { getSetting, requireSetting } from './settings';

let _client: MinioClient | null = null;

export async function minio(): Promise<MinioClient> {
  if (_client) return _client;
  const endpoint = (await getSetting('MINIO_ENDPOINT')) ?? 'minio';
  const port = parseInt((await getSetting('MINIO_PORT')) ?? '9000', 10);
  const useSSL = (await getSetting('MINIO_USE_SSL')) === 'true';
  _client = new MinioClient({
    endPoint: endpoint,
    port,
    useSSL,
    accessKey: await requireSetting('MINIO_ROOT_USER'),
    secretKey: await requireSetting('MINIO_ROOT_PASSWORD'),
  });
  return _client;
}

export async function ensureBucket(): Promise<string> {
  const bucket = (await getSetting('MINIO_BUCKET')) ?? 'realva-documents';
  const c = await minio();
  const exists = await c.bucketExists(bucket).catch(() => false);
  if (!exists) await c.makeBucket(bucket);
  return bucket;
}

export async function putObject(key: string, body: Buffer, contentType = 'application/octet-stream'): Promise<string> {
  const bucket = await ensureBucket();
  const c = await minio();
  await c.putObject(bucket, key, body, body.length, { 'Content-Type': contentType });
  const base = (await getSetting('MINIO_PUBLIC_URL')) ?? `${(await getSetting('APP_URL')) ?? ''}/files`;
  return `${base}/${bucket}/${key}`;
}

export function makeObjectKey(prefix: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}/${date}/${randomUUID()}.${ext}`;
}

export async function getObjectStream(key: string) {
  const bucket = await ensureBucket();
  const c = await minio();
  return c.getObject(bucket, key);
}

export async function ping(): Promise<{ ok: boolean; detail: string }> {
  try {
    const c = await minio();
    const bucket = (await getSetting('MINIO_BUCKET')) ?? 'realva-documents';
    await c.bucketExists(bucket);
    return { ok: true, detail: `MinIO bucket ${bucket}` };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}
