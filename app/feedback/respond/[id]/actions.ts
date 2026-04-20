'use server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export async function submitFeedback(propertyId: string, formData: FormData) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new Error('Property not found');

  const responseJson: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (['visitor', 'visitorEmail'].includes(k)) continue;
    if (typeof v === 'string' && v.trim()) responseJson[k] = v.trim();
  }

  await prisma.showingFeedback.create({
    data: {
      userId: property.userId,
      propertyId,
      visitor: String(formData.get('visitor') ?? '').trim() || 'Anonymous',
      visitorEmail: String(formData.get('visitorEmail') ?? '').trim() || null,
      responseJson,
    },
  });

  redirect(`/feedback/thanks`);
}
