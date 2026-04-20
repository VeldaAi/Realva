'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { fetchCensus, fetchSchools } from '@/lib/neighborhood';
import { chatJson } from '@/lib/ollama';
import { neighborhoodNarrative } from '@/lib/prompts';
import { renderPdf } from '@/lib/pdf';
import { prisma, json } from '@/lib/db';

export async function generateNeighborhood(formData: FormData) {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'neighborhoods');
  if (!rl.allowed) throw new Error('Rate limit exceeded.');

  const neighborhood = String(formData.get('neighborhood') ?? '').trim();
  const zip = String(formData.get('zip') ?? '').trim();
  if (!neighborhood) throw new Error('Neighborhood required');

  const [demographics, schoolsData] = await Promise.all([fetchCensus(zip || 'FL'), fetchSchools(zip)]);

  const { system, user: prompt } = neighborhoodNarrative({ neighborhood, demographics, schools: schoolsData.schools });
  const narrative = await chatJson<{
    overview: string;
    demographics: string;
    schools: string;
    safety: string;
    considerations: string[];
  }>([{ role: 'system', content: system }, { role: 'user', content: prompt }], { temperature: 0.4 });

  const pdf = await renderPdf({
    template: 'neighborhood.html',
    data: {
      neighborhood,
      demographics,
      schools: schoolsData.schools,
      schoolsSource: schoolsData.source,
      narrative,
    },
    user,
    keyPrefix: 'neighborhoods',
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      type: 'NEIGHBORHOOD_REPORT',
      title: `Neighborhood — ${neighborhood}`,
      contentJson: json({ neighborhood, demographics, schools: schoolsData.schools, narrative }),
      pdfUrl: pdf.url,
    },
  });

  redirect(pdf.url);
}
