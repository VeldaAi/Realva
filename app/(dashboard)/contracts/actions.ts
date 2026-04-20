'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { renderPdf } from '@/lib/pdf';
import { prisma, json } from '@/lib/db';

export async function fillContract(formData: FormData) {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'contracts');
  if (!rl.allowed) throw new Error('Rate limit exceeded.');

  const num = (k: string) => (formData.get(k) ? Number(formData.get(k)) : undefined);
  const str = (k: string) => String(formData.get(k) ?? '').trim();
  const date = (k: string) => {
    const v = str(k);
    return v ? new Date(v + 'T00:00:00') : undefined;
  };

  const data = {
    property: { address: str('address') },
    parties: { seller: str('seller'), buyer: str('buyer') },
    terms: {
      purchasePrice: num('purchasePrice') ?? 0,
      initialDeposit: num('initialDeposit'),
      additionalDeposit: num('additionalDeposit'),
      loanAmount: num('loanAmount'),
      financingType: str('financingType') || 'Conventional',
      closingDate: date('closingDate'),
      financingDeadline: date('financingDeadline'),
      inspectionPeriodDays: num('inspectionPeriodDays') ?? 15,
      titlePeriodDays: num('titlePeriodDays') ?? 5,
    },
  };

  const pdf = await renderPdf({
    template: 'contract.html',
    data,
    user,
    keyPrefix: 'contracts',
  });

  const property = await prisma.property.upsert({
    where: { id: `contract-${user.id}-${str('address').replace(/\W+/g, '-').toLowerCase()}` },
    create: {
      id: `contract-${user.id}-${str('address').replace(/\W+/g, '-').toLowerCase()}`,
      userId: user.id,
      address: str('address'),
      city: '',
      state: 'FL',
      zip: '',
      dataJson: json(data),
    },
    update: { dataJson: json(data) },
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      type: 'CONTRACT',
      title: `Contract — ${str('address')}`,
      contentJson: json(data),
      pdfUrl: pdf.url,
      propertyId: property.id,
    },
  });

  // Auto-create deadline rows from the dates
  const deadlines: { type: 'INSPECTION' | 'FINANCING' | 'CLOSING' | 'TITLE'; label: string; dueDate: Date }[] = [];
  if (data.terms.closingDate) deadlines.push({ type: 'CLOSING', label: 'Closing', dueDate: data.terms.closingDate });
  if (data.terms.financingDeadline) deadlines.push({ type: 'FINANCING', label: 'Financing contingency', dueDate: data.terms.financingDeadline });
  const base = new Date();
  if (data.terms.inspectionPeriodDays)
    deadlines.push({
      type: 'INSPECTION',
      label: 'Inspection period ends',
      dueDate: new Date(base.getTime() + data.terms.inspectionPeriodDays * 86_400_000),
    });
  if (data.terms.titlePeriodDays)
    deadlines.push({
      type: 'TITLE',
      label: 'Title review ends',
      dueDate: new Date(base.getTime() + data.terms.titlePeriodDays * 86_400_000),
    });

  await prisma.deadline.createMany({
    data: deadlines.map((d) => ({ userId: user.id, propertyId: property.id, ...d })),
  });

  redirect(pdf.url || `/dashboard`);
}
