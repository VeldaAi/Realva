'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { chatJson } from '@/lib/ollama';
import { listingDescription } from '@/lib/prompts';
import { prisma, json } from '@/lib/db';

export async function writeListing(formData: FormData) {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'listings');
  if (!rl.allowed) throw new Error('Rate limit exceeded.');

  const specs = {
    address: String(formData.get('address') ?? ''),
    beds: Number(formData.get('beds') ?? 0),
    baths: Number(formData.get('baths') ?? 0),
    sqft: Number(formData.get('sqft') ?? 0),
    year: formData.get('year') ? Number(formData.get('year')) : undefined,
    price: formData.get('price') ? Number(formData.get('price')) : undefined,
    features: String(formData.get('features') ?? ''),
  };
  const tone = String(formData.get('tone') ?? 'confident');
  const { system, user: userPrompt } = listingDescription(specs, tone);

  const variants = await chatJson<{
    short: string;
    medium: string;
    long: string;
    highlights: string[];
  }>([{ role: 'system', content: system }, { role: 'user', content: userPrompt }], { temperature: 0.7 });

  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      type: 'LISTING_DESCRIPTION',
      title: `Listing — ${specs.address}`,
      contentJson: json({ specs, tone, variants }),
    },
  });

  redirect(`/listings/${doc.id}`);
}
