import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';

export default async function OpenHouseDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const property = await prisma.property.findFirst({ where: { id, userId: user.id } });
  if (!property) notFound();

  const visitors = await prisma.openHouseVisitor.findMany({
    where: { propertyId: id },
    orderBy: { visitedAt: 'desc' },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title={property.address} description={`${visitors.length} sign-ins.`} />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Email</th>
              <th className="px-3 py-2 font-semibold">Phone</th>
              <th className="px-3 py-2 font-semibold">When</th>
            </tr>
          </thead>
          <tbody>
            {visitors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-sm text-slate-500">
                  No sign-ins yet. Print the QR sheet and bring it to your open house.
                </td>
              </tr>
            )}
            {visitors.map((v) => (
              <tr key={v.id} className="border-t border-slate-200">
                <td className="px-3 py-2">{v.name}</td>
                <td className="px-3 py-2">{v.email ?? '—'}</td>
                <td className="px-3 py-2">{v.phone ?? '—'}</td>
                <td className="px-3 py-2 text-slate-500">{v.visitedAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
