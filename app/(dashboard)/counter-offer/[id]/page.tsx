import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';

export default async function CounterDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const doc = await prisma.document.findFirst({
    where: { id, userId: user.id, type: 'ADDENDUM' },
  });
  if (!doc) notFound();
  const c = doc.contentJson as { subject: string; body_html: string; plain_text: string; talking_points: string[] };

  return (
    <div className="max-w-3xl">
      <PageHeader title={c.subject || 'Counter-offer'} description="Copy into your addendum form. Not legal advice." />

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Formal language</h3>
        <div className="prose prose-sm mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: c.body_html }} />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Plain text (for email)</h3>
        <pre className="mt-2 whitespace-pre-wrap text-sm">{c.plain_text}</pre>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Talking points for the client</h3>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {c.talking_points.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
