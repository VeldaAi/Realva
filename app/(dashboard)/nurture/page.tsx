import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';

export default async function NurturePage() {
  const user = await requireUser();
  const sequences = await prisma.emailSequence.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { lead: true },
  });

  const byLead = new Map<string, { leadName: string; steps: typeof sequences }>();
  for (const s of sequences) {
    const key = s.leadId;
    if (!byLead.has(key)) byLead.set(key, { leadName: s.lead.name, steps: [] });
    byLead.get(key)!.steps.push(s);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Email Nurture Drips" description="5-email sequences per lead, scheduled via BullMQ.">
        <Link href="/nurture/new" className="rounded bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white">
          New sequence
        </Link>
      </PageHeader>

      {byLead.size === 0 ? (
        <p className="text-sm text-slate-500">No drips yet. Start with a lead → click "Start nurture drip".</p>
      ) : (
        <ul className="space-y-3">
          {Array.from(byLead.entries()).map(([leadId, { leadName, steps }]) => {
            const sent = steps.filter((s) => s.sentAt).length;
            return (
              <li key={leadId} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <strong>{leadName}</strong>
                  <span className="text-xs text-slate-500">
                    {sent}/{steps.length} sent
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
