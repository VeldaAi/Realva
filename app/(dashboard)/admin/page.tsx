import Link from 'next/link';
import { prisma } from '@/lib/db';
import { checkAllApis } from '@/lib/api-health';

export default async function AdminOverview() {
  const [users, documents, leads, apis] = await Promise.all([
    prisma.user.count(),
    prisma.document.count(),
    prisma.lead.count(),
    checkAllApis(),
  ]);

  const okCount = apis.filter((a) => a.ok).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Users" value={users} />
        <Stat label="Documents" value={documents} />
        <Stat label="Leads" value={leads} />
        <Stat label="APIs online" value={`${okCount} / ${apis.length}`} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Quick actions
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/admin/apis" className="font-medium text-slate-900 underline">
              Manage API keys
            </Link>{' '}
            — paste DeepSeek, Stripe, Resend, RentCast keys, see green/red status live.
          </li>
          <li>
            <Link href="/admin/analytics" className="font-medium text-slate-900 underline">
              View analytics
            </Link>{' '}
            — document volume, revenue, API usage.
          </li>
          <li>
            <Link href="/admin/users" className="font-medium text-slate-900 underline">
              Manage users
            </Link>{' '}
            — upgrade roles, see plans.
          </li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
