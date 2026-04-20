import Redis from 'ioredis';
import { env } from './env';

/** Shared BullMQ-safe Redis client. */
declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

export const redis: Redis =
  global.__redis ??
  new Redis(env('REDIS_URL'), {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__redis = redis;
}
