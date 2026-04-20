'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { chatJson } from '@/lib/ollama';
import { counterOffer } from '@/lib/prompts';
import { prisma, json } from '@/lib/db';

export async function draftCounter(formData: FormData) {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'counter-offer');
  if (!rl.allowed) throw new Error('Rate limit exceeded.');

  const dealSummary = String(formData.get('dealSummary') ?? '').trim();
  const changes = String(formData.get('changes') ?? '').trim();
  const tone = String(formData.get('tone') ?? 'professional');
  if (!dealSummary || !changes) throw new Error('Both fields required');

  const { system, user: userPrompt } = counterOffer(dealSummary, changes, tone);
  const result = await chatJson<{
    subject: string;
    body_html: string;
    plain_text: string;
    talking_points: string[];
  }>([{ role: 'system', content: system }, { role: 'user', content: userPrompt }], { temperature: 0.4 });

  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      type: 'ADDENDUM',
      title: result.subject || 'Counter-offer addendum',
      contentJson: json({ dealSummary, changes, tone, ...result }),
    },
  });

  redirect(`/counter-offer/${doc.id}`);
}
