'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { chatJson } from '@/lib/ollama';
import { leadFollowUp } from '@/lib/prompts';
import { prisma } from '@/lib/db';

export async function createLead(formData: FormData) {
  const user = await requireUser();
  const lead = await prisma.lead.create({
    data: {
      userId: user.id,
      name: String(formData.get('name') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim() || null,
      email: String(formData.get('email') ?? '').trim() || null,
      notes: String(formData.get('notes') ?? '').trim() || null,
    },
  });
  revalidatePath('/leads');
  redirect(`/leads/${lead.id}`);
}

export async function generateFollowUp(leadId: string) {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'lead-followup');
  if (!rl.allowed) throw new Error('Rate limit exceeded.');

  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId: user.id } });
  if (!lead) throw new Error('Lead not found');

  const { system, user: userPrompt } = leadFollowUp({
    name: lead.name,
    notes: lead.notes,
    source: lead.source,
    status: lead.status,
  });
  const result = await chatJson<{ friendly: string; urgent: string; professional: string }>(
    [{ role: 'system', content: system }, { role: 'user', content: userPrompt }],
    { temperature: 0.7 },
  );

  await prisma.document.create({
    data: {
      userId: user.id,
      type: 'FOLLOW_UP',
      title: `Follow-up — ${lead.name}`,
      contentJson: { leadId, ...result },
    },
  });

  revalidatePath(`/leads/${leadId}`);
  return result;
}
