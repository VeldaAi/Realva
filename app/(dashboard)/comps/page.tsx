import { PageHeader } from '@/components/ui/page-header';
import { Field, SubmitButton } from '@/components/ui/form';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import { pullComps } from './actions';

export default async function CompsPage() {
  const user = await requireUser();
  const recent = await prisma.document.findMany({
    where: { userId: user.id, type: 'COMPS' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Comps Puller"
        description="Enter a Florida address, get 5 recent comparable sales as a branded PDF."
      />

      <form action={pullComps} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Property address" name="address" placeholder="123 Ocean Dr, Miami Beach, FL 33139" required />
        <Field label="Search radius (miles)" name="radius" type="number" defaultValue={1} hint="1 mile default. Wider = more results, less relevance." />
        <SubmitButton>Pull comps</SubmitButton>
      </form>

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent comps reports</h2>
          <ul className="mt-2 space-y-2">
            {recent.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2 text-sm">
                <span>{d.title}</span>
                {d.pdfUrl && <a href={d.pdfUrl} target="_blank" className="text-xs underline">Open PDF</a>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
