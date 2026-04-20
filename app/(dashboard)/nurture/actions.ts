'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { chatJson } from '@/lib/ollama';
import { nurtureSequence } from '@/lib/prompts';
import { prisma } from '@/lib/db';
import { queue, QUEUES } from '@/lib/queues';

export async function createSequence(formData: FormData) {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'nurture');
  if (!rl.allowed) throw new Error('Rate limit exceeded.');

  const leadId = String(formData.get('leadId') ?? '');
  const sellerContext = String(formData.get('sellerContext') ?? '').trim();
  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: user.id } });
  if (!lead) throw new Error('Lead not found');
  if (!lead.email) throw new Error('Lead has no email address.');

  const { system, user: prompt } = nurtureSequence(
    { name: lead.name, notes: lead.notes, status: lead.status, source: lead.source },
    sellerContext,
  );
  const { emails } = await chatJson<{ emails: { day: number; subject: string; body_html: string }[] }>(
    [{ role: 'system', content: system }, { role: 'user', content: prompt }],
    { temperature: 0.6 },
  );

  // Insert + schedule each email. BullMQ delay = ms until send.
  const now = Date.now();
  for (const [idx, e] of emails.entries()) {
    const day = Math.max(0, e.day ?? idx * 3);
    const when = new Date(now + day * 86_400_000);
    const row = await prisma.emailSequence.create({
      data: {
        userId: user.id,
        leadId: lead.id,
        step: idx,
        subject: e.subject,
        bodyHtml: e.body_html,
        scheduledAt: when,
      },
    });
    await queue(QUEUES.sequence).add(
      'send-step',
      { sequenceId: row.id },
      { delay: Math.max(0, when.getTime() - now) },
    );
  }

  redirect(`/nurture`);
}
