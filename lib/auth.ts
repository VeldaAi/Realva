import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './db';
import { envOptional } from './env';

// Placeholder is only used during `next build` when .env isn't in the
// build container. The real secret from .env is present at runtime.
const BUILD_PLACEHOLDER_SECRET = 'build-time-placeholder-secret-not-used-at-runtime';

const baseURL =
  envOptional('BETTER_AUTH_URL') ?? envOptional('APP_URL') ?? 'http://localhost:3001';

// Collect every origin we reasonably expect to receive auth requests from,
// so Better-Auth doesn't reject the POST /api/auth/sign-in/email behind
// Cloudflare + nginx.
const TRUSTED_ORIGINS = Array.from(
  new Set(
    [
      baseURL,
      envOptional('APP_URL'),
      envOptional('BETTER_AUTH_URL'),
      'https://realva.velda.ai',
      'http://localhost:3001',
    ].filter(Boolean) as string[],
  ),
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: envOptional('BETTER_AUTH_SECRET') ?? BUILD_PLACEHOLDER_SECRET,
  baseURL,
  trustedOrigins: TRUSTED_ORIGINS,
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
    // Always use secure cookies in production; the TLS is terminated by
    // Cloudflare/nginx but the cookie still travels over the public HTTPS
    // leg and browsers respect the flag based on page protocol.
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});
