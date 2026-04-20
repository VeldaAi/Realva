import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './db';
import { envOptional } from './env';

// Placeholder is only used during `next build` when .env isn't in the
// build container. The real secret from .env is present at runtime.
const BUILD_PLACEHOLDER_SECRET = 'build-time-placeholder-secret-not-used-at-runtime';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: envOptional('BETTER_AUTH_SECRET') ?? BUILD_PLACEHOLDER_SECRET,
  baseURL: envOptional('BETTER_AUTH_URL') ?? envOptional('APP_URL') ?? 'http://localhost:3001',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    cookiePrefix: 'realva',
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});
