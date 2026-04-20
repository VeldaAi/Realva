'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { fetchComps } from '@/lib/rentcast';
import { chatJson } from '@/lib/ollama';
import { cmaNarrative } from '@/lib/prompts';
import { renderPdf } from '@/lib/pdf';
import { prisma, json } from '@/lib/db';

export async function generateCMA(formData: FormData) {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'cma');
  if (!rl.allowed) throw new Error('Rate limit exceeded.');

  const subject = {
    address: String(formData.get('address') ?? ''),
    city: String(formData.get('city') ?? ''),
    state: 'FL',
    zip: String(formData.get('zip') ?? ''),
    beds: Number(formData.get('beds') ?? 0),
    baths: Number(formData.get('baths') ?? 0),
    sqft: Number(formData.get('sqft') ?? 0),
  };
  const radius = Math.max(1, Math.min(10, Number(formData.get('radius') ?? 1)));

  const comps = await fetchComps(subject.address, radius);

  const { system, user: prompt } = cmaNarrative(subject, comps);
  const narrative = await chatJson<{
    executive_summary: string;
    pricing_strategy: string;
    market_conditions: string;
    suggested_list_price_range: string;
  }>([{ role: 'system', content: system }, { role: 'user', content: prompt }], { temperature: 0.4 });

  const pdf = await renderPdf({
    template: 'cma.html',
    data: { subject, comps, narrative },
    user,
    keyPrefix: 'cma',
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      type: 'CMA',
      title: `CMA — ${subject.address}`,
      contentJson: json({ subject, comps, narrative }),
      pdfUrl: pdf.url,
    },
  });

  redirect(pdf.url);
}
