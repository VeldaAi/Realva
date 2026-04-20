import { PageHeader } from '@/components/ui/page-header';
import { Field, Select, SubmitButton } from '@/components/ui/form';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import { draftCounter } from './actions';

export default async function CounterOfferPage() {
  const user = await requireUser();
  const recent = await prisma.document.findMany({
    where: { userId: user.id, type: 'ADDENDUM' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, title: true, createdAt: true },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Counter-Offer Drafter" description="Plain-English change → formal addendum language." />

      <form action={draftCounter} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Original deal summary" name="dealSummary" textarea rows={4} placeholder="Buyer offered $500k, 15-day inspection, 30-day close, 10% down, conventional financing, closing on 12/15." required />
        <Field label="Requested changes (plain English)" name="changes" textarea rows={4} placeholder="Seller wants to raise price to $515k, extend close to 12/30, keep everything else the same." required />
        <Select label="Tone" name="tone" defaultValue="professional" options={[
          { value: 'professional', label: 'Professional' },
          { value: 'firm', label: 'Firm' },
          { value: 'collaborative', label: 'Collaborative' },
        ]} />
        <SubmitButton>Draft counter-offer</SubmitButton>
      </form>

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent</h2>
          <ul className="mt-2 space-y-1">
            {recent.map((d) => (
              <li key={d.id}>
                <a href={`/counter-offer/${d.id}`} className="text-sm text-slate-700 underline">
                  {d.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
