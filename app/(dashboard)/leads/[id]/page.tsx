import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import { FollowUpClient } from './FollowUpClient';

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const lead = await prisma.lead.findFirst({ where: { id, userId: user.id } });
  if (!lead) notFound();

  const recent = await prisma.document.findMany({
    where: { userId: user.id, type: 'FOLLOW_UP' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  const myRecent = recent.filter((d) => (d.contentJson as { leadId?: string }).leadId === lead.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title={lead.name} description={lead.notes ?? 'No notes yet.'}>
        <Link href={`/nurture/new?leadId=${lead.id}`} className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
          Start nurture drip
        </Link>
      </PageHeader>

      <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm">
        <div><strong>Email:</strong> {lead.email ?? '—'}</div>
        <div><strong>Phone:</strong> {lead.phone ?? '—'}</div>
        <div><strong>Status:</strong> {lead.status}</div>
      </div>

      <FollowUpClient leadId={lead.id} previous={myRecent.map((d) => ({ id: d.id, content: d.contentJson as { friendly: string; urgent: string; professional: string } }))} />
    </div>
  );
}
