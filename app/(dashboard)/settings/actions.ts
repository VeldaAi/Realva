'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';

export async function saveProfile(formData: FormData) {
  const user = await requireUser();
  const data = {
    phone: String(formData.get('phone') ?? '').trim() || null,
    website: String(formData.get('website') ?? '').trim() || null,
    licenseNumber: String(formData.get('licenseNumber') ?? '').trim() || null,
    headshotUrl: String(formData.get('headshotUrl') ?? '').trim() || null,
    logoUrl: String(formData.get('logoUrl') ?? '').trim() || null,
    brandColor: String(formData.get('brandColor') ?? '').trim() || null,
    footerDisclaimer: String(formData.get('footerDisclaimer') ?? '').trim() || null,
  };
  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath('/settings');
}
