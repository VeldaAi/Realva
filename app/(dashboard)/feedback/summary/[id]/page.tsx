import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';

export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const doc = await prisma.document.findFirst({ where: { id, userId: user.id, type: 'SHOWING_FEEDBACK' } });
  if (!doc) notFound();
  const s = doc.contentJson as {
    overall_sentiment: string;
    price_feedback: string;
    condition_feedback: string;
    location_feedback: string;
    patterns: string[];
    recommended_actions: string[];
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Showing feedback summary" description={`Overall sentiment: ${s.overall_sentiment}`} />
      <Panel title="Price">{s.price_feedback}</Panel>
      <Panel title="Condition">{s.condition_feedback}</Panel>
      <Panel title="Location">{s.location_feedback}</Panel>
      <Panel title="Patterns"><ul className="list-disc pl-5">{s.patterns.map((p, i) => <li key={i}>{p}</li>)}</ul></Panel>
      <Panel title="Recommended actions"><ul className="list-disc pl-5">{s.recommended_actions.map((p, i) => <li key={i}>{p}</li>)}</ul></Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}
