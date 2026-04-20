import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { stripe, planFromPriceId } from '@/lib/stripe';
import { requireSetting } from '@/lib/settings';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';
  let event: Stripe.Event;
  try {
    const s = await stripe();
    const secret = await requireSetting('STRIPE_WEBHOOK_SECRET');
    event = s.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature invalid: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await handleSubUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        // no-op — events we didn't subscribe to shouldn't even reach us
        break;
    }
  } catch (err) {
    console.error('stripe webhook handler failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  const userId = session.metadata?.userId;
  if (!customerId || !userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customerId, stripeSubscriptionId: subId ?? null },
  });
}

async function handleSubUpdated(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price?.id ?? '';
  const plan = await planFromPriceId(priceId);
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { plan, stripeSubscriptionId: sub.id },
  });
}

async function handleSubDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { plan: 'NONE', stripeSubscriptionId: null },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  await prisma.apiLog.create({
    data: {
      route: 'stripe:invoice.payment_failed',
      level: 'warn',
      message: `Payment failed for customer ${customerId}`,
      meta: { invoiceId: invoice.id, amount: invoice.amount_due },
    },
  });
}
