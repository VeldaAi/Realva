import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Field, SubmitButton } from '@/components/ui/form';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';
import { createOpenHouse } from './actions';

export default async function OpenHousePage() {
  const user = await requireUser();
  const properties = await prisma.property.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Open House Kit" description="QR-coded sign-in sheet + auto email drip to each visitor." />

      <form action={createOpenHouse} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Existing property</label>
          <select name="propertyId" className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="">— new —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">Or fill the fields below for a new property.</p>
        </div>
        <Field label="Address" name="address" />
        <div className="grid grid-cols-3 gap-3">
          <Field label="City" name="city" />
          <Field label="State" name="state" defaultValue="FL" />
          <Field label="Zip" name="zip" />
        </div>
        <SubmitButton>Generate QR sign-in sheet</SubmitButton>
      </form>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Properties with sign-ins</h2>
        <ul className="mt-2 space-y-1">
          {properties.map((p) => (
            <li key={p.id}>
              <Link href={`/open-house/${p.id}`} className="text-sm text-slate-700 underline">
                {p.address}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
