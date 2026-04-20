'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

export async function addDeadline(formData: FormData) {
  const user = await requireUser();
  const label = String(formData.get('label') ?? '').trim();
  const type = String(formData.get('type') ?? 'OTHER') as 'INSPECTION' | 'FINANCING' | 'APPRAISAL' | 'CLOSING' | 'TITLE' | 'OTHER';
  const dueDate = new Date(String(formData.get('dueDate') ?? '') + 'T00:00:00');
  if (!label || isNaN(dueDate.getTime())) throw new Error('Invalid deadline');
  await prisma.deadline.create({ data: { userId: user.id, label, type, dueDate } });
  revalidatePath('/deadlines');
}

export async function completeDeadline(id: string) {
  const user = await requireUser();
  await prisma.deadline.updateMany({ where: { id, userId: user.id }, data: { completed: true } });
  revalidatePath('/deadlines');
}
