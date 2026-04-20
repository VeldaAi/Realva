import { Client as MinioClient } from 'minio';
import { env, envOptional } from './env';
import { randomUUID } from 'node:crypto';

let _client: MinioClient | null = null;
export function minio(): MinioClient {
  if (!_client) {
    _client = new MinioClient({
      endPoint: env('MINIO_ENDPOINT'),
      port: parseInt(envOptional('MINIO_PORT') ?? '9000', 10),
      useSSL: envOptional('MINIO_USE_SSL') === 'true',
      accessKey: env('MINIO_ROOT_USER'),
      secretKey: env('MINIO_ROOT_PASSWORD'),
    });
  }
  return _client;
}

export async function ensureBucket(): Promise<string> {
  const bucket = env('MINIO_BUCKET');
  const c = minio();
  const exists = await c.bucketExists(bucket).catch(() => false);
  if (!exists) await c.makeBucket(bucket);
  return bucket;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType = 'application/octet-stream',
): Promise<string> {
  const bucket = await ensureBucket();
  await minio().putObject(bucket, key, body, body.length, { 'Content-Type': contentType });
  const base = envOptional('MINIO_PUBLIC_URL') ?? `${env('APP_URL')}/files`;
  return `${base}/${bucket}/${key}`;
}

export function makeObjectKey(prefix: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}/${date}/${randomUUID()}.${ext}`;
}

export async function getObjectStream(key: string) {
  const bucket = await ensureBucket();
  return minio().getObject(bucket, key);
}
