'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-helpers';
import { chatJson } from '@/lib/ollama';
import { showingFeedbackSummary } from '@/lib/prompts';
import { prisma } from '@/lib/db';
import { getSetting } from '@/lib/settings';
import { queue, QUEUES } from '@/lib/queues';

export async function sendFeedbackRequest(formData: FormData) {
  const user = await requireUser();
  const visitor = String(formData.get('visitor') ?? '').trim();
  const visitorEmail = String(formData.get('visitorEmail') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();

  const property = await prisma.property.findFirst({ where: { userId: user.id, address } })
    ?? await prisma.property.create({ data: { userId: user.id, address, city: '', state: 'FL', zip: '', dataJson: {} } });

  const appUrl = (await getSetting('APP_URL')) ?? 'http://localhost:3001';
  const link = `${appUrl}/feedback/respond/${property.id}?visitor=${encodeURIComponent(visitor)}&email=${encodeURIComponent(visitorEmail)}`;

  await queue(QUEUES.email).add('feedback-invite', {
    to: visitorEmail,
    subject: `Quick question about ${property.address}`,
    html: `<p>Hi ${visitor},</p><p>Thanks for checking out ${property.address}. Would you mind sharing a few quick thoughts? Takes 60 seconds.</p><p><a href="${link}">Answer 5 quick questions →</a></p>`,
  });

  redirect('/feedback');
}

export async function summarize() {
  const user = await requireUser();
  const rows = await prisma.showingFeedback.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  if (rows.length === 0) return;

  const responses = rows.map((r) => ({ visitor: r.visitor, answers: r.responseJson as Record<string, string> }));
  const { system, user: prompt } = showingFeedbackSummary(responses);
  const summary = await chatJson<Record<string, unknown>>(
    [{ role: 'system', content: system }, { role: 'user', content: prompt }],
    { temperature: 0.3 },
  );

  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      type: 'SHOWING_FEEDBACK',
      title: `Showing feedback summary`,
      contentJson: summary,
    },
  });

  redirect(`/feedback/summary/${doc.id}`);
}
