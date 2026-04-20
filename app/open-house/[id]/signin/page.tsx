import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { signInVisitor } from '@/app/(dashboard)/open-house/actions';

export default async function PublicSignIn({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) notFound();

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-10">
      <h1 className="text-xl font-bold">Welcome to {property.address}</h1>
      <p className="mt-2 text-sm text-slate-600">Sign in to get pricing updates on this listing.</p>
      <form action={signInVisitor.bind(null, id)} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input name="name" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input name="email" type="email" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <input name="phone" type="tel" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Sign in
        </button>
      </form>
    </div>
  );
}
