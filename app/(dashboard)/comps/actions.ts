'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { fetchComps } from '@/lib/rentcast';
import { renderPdf } from '@/lib/pdf';
import { prisma } from '@/lib/db';

export async function pullComps(formData: FormData) {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'comps');
  if (!rl.allowed) throw new Error('Rate limit exceeded. Try again next hour.');

  const address = String(formData.get('address') ?? '').trim();
  const radius = Math.max(1, Math.min(10, parseInt(String(formData.get('radius') ?? '1'), 10)));
  if (!address) throw new Error('Address required');

  const comps = await fetchComps(address, radius);

  const pdf = await renderPdf({
    template: 'comps.html',
    data: { address, count: comps.length, comps },
    user,
    keyPrefix: 'comps',
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      type: 'COMPS',
      title: `Comps — ${address}`,
      contentJson: { address, radius, comps },
      pdfUrl: pdf.url,
    },
  });

  revalidatePath('/comps');
  redirect(pdf.url);
}
