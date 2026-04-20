'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { chatJson } from '@/lib/ollama';
import { socialPost } from '@/lib/prompts';
import { prisma } from '@/lib/db';

export async function generateSocial(formData: FormData) {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'social');
  if (!rl.allowed) throw new Error('Rate limit exceeded.');

  const property = {
    address: String(formData.get('address') ?? ''),
    beds: Number(formData.get('beds') ?? 0),
    baths: Number(formData.get('baths') ?? 0),
    sqft: Number(formData.get('sqft') ?? 0),
    price: Number(formData.get('price') ?? 0),
    features: String(formData.get('features') ?? ''),
  };

  const { system, user: userPrompt } = socialPost(property);
  const variants = await chatJson<{
    instagram: { caption: string; hashtags: string[] };
    facebook: { caption: string };
    linkedin: { caption: string };
  }>([{ role: 'system', content: system }, { role: 'user', content: userPrompt }], { temperature: 0.8 });

  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      type: 'SOCIAL_POST',
      title: `Social — ${property.address}`,
      contentJson: { property, variants },
    },
  });

  redirect(`/social/${doc.id}`);
}
