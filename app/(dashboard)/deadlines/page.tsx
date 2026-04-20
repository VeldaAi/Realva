import { PageHeader } from '@/components/ui/page-header';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import { completeDeadline, addDeadline } from './actions';
import { Field, SubmitButton } from '@/components/ui/form';

export default async function DeadlinesPage() {
  const user = await requireUser();
  const [open, done] = await Promise.all([
    prisma.deadline.findMany({
      where: { userId: user.id, completed: false },
      orderBy: { dueDate: 'asc' },
      include: { property: true },
    }),
    prisma.deadline.findMany({
      where: { userId: user.id, completed: true },
      orderBy: { dueDate: 'desc' },
      take: 20,
      include: { property: true },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Deadlines" description="T-minus-72h email alerts go out automatically via BullMQ." />

      <form action={addDeadline} className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-4">
        <Field label="Label" name="label" required />
        <Field label="Due date" name="dueDate" type="date" required />
        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select name="type" className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
            {['INSPECTION', 'FINANCING', 'APPRAISAL', 'CLOSING', 'TITLE', 'OTHER'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end"><SubmitButton>Add</SubmitButton></div>
      </form>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming ({open.length})</h2>
        <ul className="mt-2 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {open.length === 0 && <li className="p-4 text-sm text-slate-500">No upcoming deadlines.</li>}
          {open.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div>
                <div className="font-medium">{d.label}</div>
                <div className="text-xs text-slate-500">
                  {d.type} · {d.dueDate.toLocaleDateString()} {d.property ? `· ${d.property.address}` : ''}
                </div>
              </div>
              <form action={completeDeadline.bind(null, d.id)}>
                <button type="submit" className="rounded border border-slate-300 px-3 py-1 text-xs">Done</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {done.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recently completed</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-500">
            {done.map((d) => (
              <li key={d.id}>
                {d.label} — {d.dueDate.toLocaleDateString()}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
