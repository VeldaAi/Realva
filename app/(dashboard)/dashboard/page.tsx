import Link from 'next/link';
import { requireUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

const TOOLS = [
  { href: '/comps', title: 'Comps Puller', desc: 'Pull 5 comps for any FL address.' },
  { href: '/listings', title: 'Listing Description Writer', desc: 'MLS-ready copy, 3 length variants.' },
  { href: '/contracts', title: 'FAR/BAR Contract Filler', desc: 'Fill an AS-IS contract PDF.' },
  { href: '/counter-offer', title: 'Counter-Offer Drafter', desc: 'Plain English → addendum language.' },
  { href: '/flyers', title: 'Property Flyer', desc: 'Branded 1-page PDF flyer.' },
  { href: '/social', title: 'Social Posts', desc: 'IG / FB / LinkedIn variants.' },
  { href: '/leads', title: 'Lead Follow-Up Texts', desc: '3 tone variants per lead.' },
  { href: '/open-house', title: 'Open House Kit', desc: 'QR sign-in + email drip.' },
  { href: '/inspections', title: 'Inspection Summary', desc: 'Upload a PDF → plain-English.' },
  { href: '/chatbot', title: 'Buyer FAQ Bot', desc: 'Florida-RE-aware chatbot.' },
  { href: '/feedback', title: 'Showing Feedback', desc: 'Collect + summarize post-showing.' },
  { href: '/cma', title: 'CMA Generator', desc: 'Full branded CMA PDF.' },
  { href: '/neighborhoods', title: 'Neighborhood Report', desc: 'Census + schools + crime.' },
  { href: '/nurture', title: 'Email Nurture Drip', desc: '5-email sequence for a lead.' },
  { href: '/deadlines', title: 'Deadline Tracker', desc: 'T-minus alerts on contract dates.' },
];

export default async function Dashboard() {
  const user = await requireUser();
  const [docCount, leadCount, propertyCount, upcomingDeadline] = await Promise.all([
    prisma.document.count({ where: { userId: user.id } }),
    prisma.lead.count({ where: { userId: user.id } }),
    prisma.property.count({ where: { userId: user.id } }),
    prisma.deadline.findFirst({
      where: { userId: user.id, completed: false, dueDate: { gte: new Date() } },
      orderBy: { dueDate: 'asc' },
      include: { property: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Welcome, {user.email.split('@')[0]}</h1>
      <p className="mt-1 text-sm text-slate-600">What do you want to get done today?</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Documents" value={docCount} />
        <Stat label="Leads" value={leadCount} />
        <Stat label="Properties" value={propertyCount} />
        <Stat
          label="Next deadline"
          value={upcomingDeadline ? upcomingDeadline.dueDate.toLocaleDateString() : '—'}
        />
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">Tools</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-900 hover:shadow-sm"
          >
            <div className="font-semibold text-slate-900">{t.title}</div>
            <p className="mt-1 text-sm text-slate-600">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
