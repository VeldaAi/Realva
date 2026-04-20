import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, string> = {};
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    checks.postgres = 'ok';
  } catch (e) {
    checks.postgres = `error: ${(e as Error).message}`;
  }
  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'ok' : pong;
  } catch (e) {
    checks.redis = `error: ${(e as Error).message}`;
  }
  const ok = Object.values(checks).every((v) => v === 'ok');
  return NextResponse.json({ ok, checks, env: process.env.NODE_ENV ?? 'unknown' }, { status: ok ? 200 : 503 });
}
