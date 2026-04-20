import Link from 'next/link';
import { PLAN_LABELS } from '@/lib/stripe';
import { currentUser } from '@/lib/auth-helpers';
import { startCheckout } from './actions';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const user = await currentUser();
  const plans = [PLAN_LABELS.BASIC, PLAN_LABELS.PRO, PLAN_LABELS.TEAM] as const;
  const ids = ['BASIC', 'PRO', 'TEAM'] as const;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-2 text-slate-600">
          Every plan includes all 15 tools. Pay for branding and seats.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {plans.map((plan, i) => {
          const id = ids[i];
          return (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${plan.name === 'Pro' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'}`}
            >
              <div className="text-sm font-medium opacity-80">{plan.name}</div>
              <div className="mt-2 text-3xl font-bold">{plan.price}</div>
              <ul className="mt-4 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {user ? (
                <form action={startCheckout.bind(null, id)} className="mt-6">
                  <button
                    type="submit"
                    className={`w-full rounded px-4 py-2 text-sm font-semibold ${plan.name === 'Pro' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}
                  >
                    {user.plan === id ? 'Current plan' : 'Upgrade'}
                  </button>
                </form>
              ) : (
                <Link
                  href={`/signup?plan=${id}`}
                  className={`mt-6 block rounded px-4 py-2 text-center text-sm font-semibold ${plan.name === 'Pro' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}
                >
                  Start with {plan.name}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        Billing runs on Stripe. Cancel any time from your dashboard.
      </p>
    </div>
  );
}
