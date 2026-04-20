'use server';
import { redirect } from 'next/navigation';
import pdfParse from 'pdf-parse';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { chatJson } from '@/lib/ollama';
import { inspectionSummary } from '@/lib/prompts';
import { renderPdf } from '@/lib/pdf';
import { prisma } from '@/lib/db';

export async function summarizeInspection(formData: FormData) {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'inspections');
  if (!rl.allowed) throw new Error('Rate limit exceeded.');

  const address = String(formData.get('address') ?? '').trim();
  const file = formData.get('pdf');
  if (!file || !(file instanceof File)) throw new Error('PDF required');
  if (file.size > 20 * 1024 * 1024) throw new Error('PDF too large (20 MB max)');

  const buf = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buf).catch(() => ({ text: '' }));
  const text = (parsed.text || '').trim();
  if (!text) throw new Error('Could not extract text from PDF');

  const { system, user: prompt } = inspectionSummary(text);
  const summary = await chatJson<{
    executive_summary: string;
    critical_items: string[];
    moderate_items: string[];
    cosmetic_items: string[];
    recommended_next_steps: string[];
  }>([{ role: 'system', content: system }, { role: 'user', content: prompt }], { temperature: 0.3 });

  const pdf = await renderPdf({
    template: 'inspection-summary.html',
    data: { property: { address }, summary },
    user,
    keyPrefix: 'inspections',
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      type: 'INSPECTION_SUMMARY',
      title: `Inspection — ${address}`,
      contentJson: { address, summary },
      pdfUrl: pdf.url,
    },
  });

  redirect(pdf.url);
}
