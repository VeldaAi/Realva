import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-helpers';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div>
      <div className="mb-6 flex items-center gap-4 border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold">Admin</h1>
        <nav className="flex gap-3 text-sm">
          <Link href="/admin" className="text-slate-700 hover:text-slate-900">Overview</Link>
          <Link href="/admin/apis" className="text-slate-700 hover:text-slate-900">API Keys</Link>
          <Link href="/admin/analytics" className="text-slate-700 hover:text-slate-900">Analytics</Link>
          <Link href="/admin/users" className="text-slate-700 hover:text-slate-900">Users</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
