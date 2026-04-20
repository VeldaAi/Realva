import Redis from 'ioredis';
import { envOptional } from './env';

/**
 * Shared BullMQ-safe Redis client.
 *
 * `lazyConnect: true` is critical: during `next build`, Next.js imports
 * route modules to collect page data. The build container doesn't have
 * .env, so if this client tried to connect at module load, the build
 * would fail. Lazy connect defers the TCP handshake to the first command.
 */
declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

export const redis: Redis =
  global.__redis ??
  new Redis(envOptional('REDIS_URL') ?? 'redis://redis:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__redis = redis;
}
