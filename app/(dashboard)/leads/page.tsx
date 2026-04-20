import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import { createLead } from './actions';
import { Field, SubmitButton } from '@/components/ui/form';

export default async function LeadsPage() {
  const user = await requireUser();
  const leads = await prisma.lead.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Leads & Follow-Up" description="Add a lead, get 3 tone variants of a follow-up text." />

      <form action={createLead} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-4">
        <Field label="Name" name="name" required />
        <Field label="Phone" name="phone" />
        <Field label="Email" name="email" type="email" />
        <div className="flex items-end"><SubmitButton>Add lead</SubmitButton></div>
        <div className="md:col-span-4">
          <Field label="Notes (context for the follow-up)" name="notes" textarea placeholder="Met at open house Saturday; interested in 3-bed, budget $650k, pre-approved." />
        </div>
      </form>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your leads</h2>
        {leads.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No leads yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {leads.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/leads/${l.id}`}
                  className="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-3 text-sm hover:border-slate-900"
                >
                  <div>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-slate-500">{l.email ?? l.phone ?? 'no contact'}</div>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium">{l.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
