import { prisma } from '@/lib/db';
import type { Plan } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const [totalUsers, plansRaw, docTypes, lastDocs, apiErrors, revenueBreakdown] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['plan'], _count: { plan: true } }),
    prisma.document.groupBy({ by: ['type'], _count: { type: true } }),
    prisma.document.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    }),
    prisma.apiLog.count({ where: { level: 'error' } }),
    prisma.user.groupBy({
      by: ['plan'],
      _count: { plan: true },
      where: { plan: { in: ['BASIC', 'PRO', 'TEAM'] } },
    }),
  ]);

  const planPrice: Record<Plan, number> = { NONE: 0, BASIC: 29, PRO: 49, TEAM: 99 };
  const mrr = revenueBreakdown.reduce((sum, r) => sum + r._count.plan * planPrice[r.plan], 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Users" value={totalUsers} />
        <Stat label="MRR (est.)" value={`$${mrr.toLocaleString()}`} />
        <Stat label="Docs generated" value={lastDocs.length > 0 ? await prisma.document.count() : 0} />
        <Stat label="API errors (all time)" value={apiErrors} />
      </div>

      <Panel title="Plans">
        {plansRaw.length === 0 && <Empty />}
        <ul className="text-sm">
          {plansRaw.map((p) => (
            <li key={p.plan} className="flex justify-between py-1">
              <span className="font-medium">{p.plan}</span>
              <span>{p._count.plan}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Documents by type">
        {docTypes.length === 0 && <Empty />}
        <ul className="text-sm">
          {docTypes.map((d) => (
            <li key={d.type} className="flex justify-between py-1">
              <span className="font-medium">{d.type}</span>
              <span>{d._count.type}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Recent documents">
        {lastDocs.length === 0 && <Empty />}
        <ul className="text-sm">
          {lastDocs.map((d) => (
            <li key={d.id} className="flex items-center justify-between border-b border-slate-100 py-1 last:border-0">
              <span>
                <span className="font-medium">{d.type}</span> · {d.title} ·{' '}
                <span className="text-slate-500">{d.user.email}</span>
              </span>
              <span className="text-xs text-slate-500">{d.createdAt.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </Panel>
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-slate-500">No data yet.</p>;
}
