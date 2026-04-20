'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-helpers';

export async function toggleAdmin(userId: string) {
  await requireAdmin();
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return;
  const next = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
  await prisma.user.update({ where: { id: userId }, data: { role: next } });
  revalidatePath('/admin/users');
}
