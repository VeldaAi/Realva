import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { submitFeedback } from './actions';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ visitor?: string; email?: string }>;
}

export default async function FeedbackForm({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { visitor = '', email = '' } = await searchParams;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) notFound();

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <h1 className="text-xl font-bold">Quick feedback</h1>
      <p className="mt-2 text-sm text-slate-600">About your visit to {property.address}. 60 seconds.</p>

      <form action={submitFeedback.bind(null, id)} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <input type="hidden" name="visitor" value={visitor} />
        <input type="hidden" name="visitorEmail" value={email} />

        {[
          ['overall', 'Overall impression?'],
          ['price', 'Thoughts on the price?'],
          ['condition', 'Thoughts on the condition?'],
          ['location', 'How did the location feel?'],
          ['considering', 'Are you considering making an offer?'],
        ].map(([name, label]) => (
          <div key={name}>
            <label className="mb-1 block text-sm font-medium">{label}</label>
            <textarea name={name} rows={2} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          </div>
        ))}

        <button type="submit" className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Submit
        </button>
      </form>
    </div>
  );
}
