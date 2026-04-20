'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { clsx } from 'clsx';
import { signOut } from '@/lib/auth-client';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/comps', label: 'Comps Puller', icon: '📊' },
  { href: '/listings', label: 'Listing Writer', icon: '✍️' },
  { href: '/contracts', label: 'Contract Filler', icon: '📄' },
  { href: '/counter-offer', label: 'Counter-Offer', icon: '↩️' },
  { href: '/flyers', label: 'Flyers', icon: '🖼️' },
  { href: '/social', label: 'Social Posts', icon: '📱' },
  { href: '/leads', label: 'Lead Follow-Up', icon: '👥' },
  { href: '/open-house', label: 'Open House Kit', icon: '🚪' },
  { href: '/inspections', label: 'Inspection Summary', icon: '🔎' },
  { href: '/chatbot', label: 'Buyer FAQ Bot', icon: '💬' },
  { href: '/feedback', label: 'Showing Feedback', icon: '📝' },
  { href: '/cma', label: 'CMA', icon: '📈' },
  { href: '/neighborhoods', label: 'Neighborhood Reports', icon: '🏘️' },
  { href: '/nurture', label: 'Email Nurture', icon: '📧' },
  { href: '/deadlines', label: 'Deadlines', icon: '⏰' },
];

const SECONDARY = [
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

interface Props {
  user: { email: string; role: string; plan: string };
  isAdmin: boolean;
}

export function Sidebar({ user, isAdmin }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-3 top-3 z-40 rounded-md border border-slate-300 bg-white p-2 text-sm shadow-sm md:hidden"
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            Realva
          </Link>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {user.plan}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'mb-0.5 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                  active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                <span className="w-5">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="my-3 border-t border-slate-200" />

          {SECONDARY.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'mb-0.5 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                  active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                <span className="w-5">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={clsx(
                'mb-0.5 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                pathname.startsWith('/admin')
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-700 hover:bg-indigo-50',
              )}
            >
              <span className="w-5">🛡️</span>
              <span>Admin</span>
            </Link>
          )}
        </nav>

        <div className="border-t border-slate-200 px-4 py-3 text-xs">
          <div className="truncate font-medium text-slate-900">{user.email}</div>
          <button
            onClick={async () => {
              await signOut();
              window.location.href = '/login';
            }}
            className="mt-2 w-full rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      {open && (
        <button
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
        />
      )}
    </>
  );
}
