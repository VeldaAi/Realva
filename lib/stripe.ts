import Stripe from 'stripe';
import { env } from './env';
import type { Plan } from '@prisma/client';

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(env('STRIPE_SECRET_KEY'), { apiVersion: '2024-09-30.acacia' });
  }
  return _stripe;
}

export function priceIdForPlan(plan: Exclude<Plan, 'NONE'>): string {
  if (plan === 'BASIC') return env('STRIPE_PRICE_BASIC');
  if (plan === 'PRO') return env('STRIPE_PRICE_PRO');
  return env('STRIPE_PRICE_TEAM');
}

export function planFromPriceId(priceId: string): Plan {
  if (priceId === env('STRIPE_PRICE_BASIC')) return 'BASIC';
  if (priceId === env('STRIPE_PRICE_PRO')) return 'PRO';
  if (priceId === env('STRIPE_PRICE_TEAM')) return 'TEAM';
  return 'NONE';
}

export const PLAN_LABELS: Record<Exclude<Plan, 'NONE'>, { name: string; price: string; watermark: boolean; seats: number }> = {
  BASIC: { name: 'Basic', price: '$29/mo', watermark: true, seats: 1 },
  PRO: { name: 'Pro', price: '$49/mo', watermark: false, seats: 1 },
  TEAM: { name: 'Team', price: '$99/mo', watermark: false, seats: 5 },
};
