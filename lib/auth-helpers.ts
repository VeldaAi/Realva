/**
 * Server-side auth helpers used by layouts, server components, and server actions.
 * Throws redirect()-style errors; caller pages can catch and redirect.
 */
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';
import { prisma } from './db';
import type { User } from '@prisma/client';

export async function currentUser(): Promise<User | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'ADMIN' && !isAdminEmail(user.email)) redirect('/dashboard');
  return user;
}

export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function isAdmin(user: Pick<User, 'role' | 'email'> | null): Promise<boolean> {
  if (!user) return false;
  return user.role === 'ADMIN' || isAdminEmail(user.email);
}
