import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Field, SubmitButton } from '@/components/ui/form';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import { sendFeedbackRequest, summarize } from './actions';

export default async function FeedbackPage() {
  const user = await requireUser();
  const recent = await prisma.showingFeedback.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { property: true },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Showing Feedback" description="Email a feedback survey after a showing. Realva summarizes the responses into actionable themes." />

      <form action={sendFeedbackRequest} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Visitor name" name="visitor" required />
        <Field label="Visitor email" name="visitorEmail" type="email" required />
        <Field label="Property address" name="address" required />
        <SubmitButton>Send feedback survey</SubmitButton>
      </form>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent responses</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No responses yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="rounded border border-slate-200 bg-white p-3 text-sm">
                <strong>{r.visitor}</strong> · {r.property?.address ?? '—'} ·{' '}
                <span className="text-slate-500">{r.createdAt.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
        {recent.length > 0 && (
          <form action={summarize} className="mt-4">
            <button className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Summarize all feedback
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
