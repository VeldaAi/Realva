import { Sidebar } from '@/components/sidebar';
import { requireUser, isAdmin } from '@/lib/auth-helpers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const admin = await isAdmin(user);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        user={{ email: user.email, role: user.role, plan: user.plan }}
        isAdmin={admin}
      />
      <main className="min-h-screen md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
