import { redis } from './redis';
import { envOptional } from './env';

export async function rateLimit(userId: string, route: string): Promise<{ allowed: boolean; remaining: number }> {
  const max = parseInt(envOptional('RATE_LIMIT_PER_HOUR') ?? '100', 10);
  const bucket = `rl:${userId}:${route}:${Math.floor(Date.now() / 3_600_000)}`;
  const count = await redis.incr(bucket);
  if (count === 1) await redis.expire(bucket, 3600);
  return { allowed: count <= max, remaining: Math.max(0, max - count) };
}
