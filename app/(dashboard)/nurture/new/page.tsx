import { PageHeader } from '@/components/ui/page-header';
import { Field, SubmitButton } from '@/components/ui/form';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import { createSequence } from '../actions';

interface Props {
  searchParams: Promise<{ leadId?: string }>;
}

export default async function NewNurturePage({ searchParams }: Props) {
  const user = await requireUser();
  const { leadId } = await searchParams;
  const leads = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="max-w-2xl">
      <PageHeader title="New nurture sequence" description="Realva drafts 5 emails; BullMQ sends them on days 0/2/5/10/20." />

      <form action={createSequence} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Lead</label>
          <select name="leadId" required defaultValue={leadId} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="">— select —</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} {l.email ? `<${l.email}>` : ''}
              </option>
            ))}
          </select>
        </div>
        <Field label="What YOU sell (1-2 sentences)" name="sellerContext" textarea required placeholder="I help Miami beach condo buyers find unit-specific insurance-friendly buildings..." />
        <SubmitButton>Generate + schedule 5 emails</SubmitButton>
      </form>
    </div>
  );
}
