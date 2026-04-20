'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { chatJson } from '@/lib/ollama';
import { flyerCopy } from '@/lib/prompts';
import { renderPdf } from '@/lib/pdf';
import { prisma } from '@/lib/db';

export async function generateFlyer(formData: FormData) {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'flyers');
  if (!rl.allowed) throw new Error('Rate limit exceeded.');

  const property = {
    address: String(formData.get('address') ?? ''),
    city: String(formData.get('city') ?? ''),
    state: String(formData.get('state') ?? 'FL'),
    beds: Number(formData.get('beds') ?? 0),
    baths: Number(formData.get('baths') ?? 0),
    sqft: Number(formData.get('sqft') ?? 0),
    price: Number(formData.get('price') ?? 0),
    features: String(formData.get('features') ?? ''),
  };

  const { system, user: userPrompt } = flyerCopy(property);
  const copy = await chatJson<{ headline: string; subheadline: string; body: string; bullets: string[]; cta: string }>(
    [{ role: 'system', content: system }, { role: 'user', content: userPrompt }],
    { temperature: 0.6 },
  );

  const pdf = await renderPdf({
    template: 'flyer.html',
    data: { property, copy },
    user,
    keyPrefix: 'flyers',
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      type: 'FLYER',
      title: `Flyer — ${property.address}`,
      contentJson: { property, copy },
      pdfUrl: pdf.url,
    },
  });

  redirect(pdf.url);
}
