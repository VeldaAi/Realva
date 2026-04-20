'use server';
import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { requireUser } from '@/lib/auth-helpers';
import { renderPdf } from '@/lib/pdf';
import { prisma } from '@/lib/db';
import { getSetting } from '@/lib/settings';

export async function createOpenHouse(formData: FormData) {
  const user = await requireUser();
  let propertyId = String(formData.get('propertyId') ?? '').trim();

  if (!propertyId) {
    const created = await prisma.property.create({
      data: {
        userId: user.id,
        address: String(formData.get('address') ?? '').trim(),
        city: String(formData.get('city') ?? '').trim(),
        state: String(formData.get('state') ?? 'FL').trim(),
        zip: String(formData.get('zip') ?? '').trim(),
        dataJson: {},
      },
    });
    propertyId = created.id;
  }
  const property = await prisma.property.findFirst({ where: { id: propertyId, userId: user.id } });
  if (!property) throw new Error('Property not found');

  const appUrl = (await getSetting('APP_URL')) ?? 'http://localhost:3001';
  const signInUrl = `${appUrl}/open-house/${property.id}/signin`;
  const qrDataUrl = await QRCode.toDataURL(signInUrl, { width: 400, margin: 1 });

  const pdf = await renderPdf({
    template: 'open-house-qr.html',
    data: { property, signInUrl, qrDataUrl },
    user,
    keyPrefix: 'open-house',
  });

  await prisma.document.create({
    data: {
      userId: user.id,
      type: 'FLYER',
      title: `Open House QR — ${property.address}`,
      contentJson: { signInUrl },
      pdfUrl: pdf.url,
      propertyId: property.id,
    },
  });

  redirect(pdf.url);
}

export async function signInVisitor(propertyId: string, formData: FormData) {
  // Public — no auth required. That's by design: visitors at the open house sign in.
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new Error('Property not found');

  const visitor = await prisma.openHouseVisitor.create({
    data: {
      userId: property.userId,
      propertyId,
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim() || null,
      phone: String(formData.get('phone') ?? '').trim() || null,
    },
  });

  // Fire off a "thanks for stopping by" email if we have an address
  if (visitor.email) {
    const { queue, QUEUES } = await import('@/lib/queues');
    await queue(QUEUES.email).add('oh-thanks', {
      to: visitor.email,
      subject: `Thanks for stopping by — ${property.address}`,
      html: `<p>Hi ${visitor.name},</p><p>Thanks for visiting our open house at ${property.address}. I'll be in touch with any updates on pricing or similar listings.</p>`,
    });
  }

  redirect(`/open-house/${propertyId}/thanks`);
}
