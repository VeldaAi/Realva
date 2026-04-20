import Stripe from 'stripe';
import type { Plan } from '@prisma/client';
import { getSetting, requireSetting } from './settings';

let _stripe: Stripe | null = null;
let _cachedKey: string | null = null;

export async function stripe(): Promise<Stripe> {
  const sk = await requireSetting('STRIPE_SECRET_KEY');
  if (!_stripe || _cachedKey !== sk) {
    _stripe = new Stripe(sk, { apiVersion: '2024-09-30.acacia' });
    _cachedKey = sk;
  }
  return _stripe;
}

export async function priceIdForPlan(plan: Exclude<Plan, 'NONE'>): Promise<string> {
  if (plan === 'BASIC') return requireSetting('STRIPE_PRICE_BASIC');
  if (plan === 'PRO') return requireSetting('STRIPE_PRICE_PRO');
  return requireSetting('STRIPE_PRICE_TEAM');
}

export async function planFromPriceId(priceId: string): Promise<Plan> {
  const basic = await getSetting('STRIPE_PRICE_BASIC');
  const pro = await getSetting('STRIPE_PRICE_PRO');
  const team = await getSetting('STRIPE_PRICE_TEAM');
  if (priceId === basic) return 'BASIC';
  if (priceId === pro) return 'PRO';
  if (priceId === team) return 'TEAM';
  return 'NONE';
}

export const PLAN_LABELS: Record<Exclude<Plan, 'NONE'>, { name: string; price: string; watermark: boolean; seats: number; features: string[] }> = {
  BASIC: {
    name: 'Basic',
    price: '$29/mo',
    watermark: true,
    seats: 1,
    features: ['All 15 tools', 'Up to 100 docs/mo', 'Watermarked PDFs ("Powered by Realva")', 'Email support'],
  },
  PRO: {
    name: 'Pro',
    price: '$49/mo',
    watermark: false,
    seats: 1,
    features: ['All 15 tools', 'Unlimited docs', 'Full branding, no watermark', 'Priority email support'],
  },
  TEAM: {
    name: 'Team',
    price: '$99/mo',
    watermark: false,
    seats: 5,
    features: ['Up to 5 agent seats', 'Shared brokerage branding', 'Unlimited docs', 'Priority support'],
  },
};

export async function ping(): Promise<{ ok: boolean; detail: string }> {
  try {
    const s = await stripe();
    const a = await s.accounts.retrieve();
    return { ok: true, detail: `Stripe account ${a.id}` };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}
