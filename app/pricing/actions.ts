'use server';
import { redirect } from 'next/navigation';
import type { Plan } from '@prisma/client';
import { prisma } from '@/lib/db';
import { priceIdForPlan, stripe } from '@/lib/stripe';
import { requireUser } from '@/lib/auth-helpers';
import { getSetting } from '@/lib/settings';

export async function startCheckout(plan: Exclude<Plan, 'NONE'>) {
  const user = await requireUser();
  const s = await stripe();
  const appUrl = (await getSetting('APP_URL')) ?? 'http://localhost:3001';

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await s.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
  }

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: await priceIdForPlan(plan), quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/pricing?cancelled=1`,
    metadata: { userId: user.id, plan },
  });

  if (session.url) redirect(session.url);
}
