import { prisma } from '@/lib/db';
import { toggleAdmin } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { id: true, email: true, role: true, plan: true, createdAt: true },
  });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Users ({users.length})</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Plan</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-200">
                <Td>{u.email}</Td>
                <Td>
                  <span className={u.role === 'ADMIN' ? 'font-semibold text-indigo-700' : ''}>
                    {u.role}
                  </span>
                </Td>
                <Td>{u.plan}</Td>
                <Td className="text-slate-500">{u.createdAt.toLocaleDateString()}</Td>
                <Td>
                  <form action={toggleAdmin.bind(null, u.id)}>
                    <button
                      type="submit"
                      className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      {u.role === 'ADMIN' ? 'Demote' : 'Promote to admin'}
                    </button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-semibold">{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
