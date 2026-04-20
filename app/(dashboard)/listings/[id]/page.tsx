import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const doc = await prisma.document.findFirst({
    where: { id, userId: user.id, type: 'LISTING_DESCRIPTION' },
  });
  if (!doc) notFound();

  const c = doc.contentJson as { variants: { short: string; medium: string; long: string; highlights: string[] }; specs: Record<string, unknown> };

  return (
    <div className="max-w-3xl">
      <PageHeader title={doc.title} description="Three length variants — copy whichever fits the MLS field." />

      <Variant label="Short (60-80 words)" text={c.variants.short} />
      <Variant label="Medium (150-180 words)" text={c.variants.medium} />
      <Variant label="Long (250-300 words)" text={c.variants.long} />

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Highlights</h3>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {c.variants.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Variant({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{text}</p>
    </div>
  );
}
