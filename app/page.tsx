import Link from 'next/link';
import { currentUser } from '@/lib/auth-helpers';

const features = [
  'Comps Puller',
  'Listing Description Writer',
  'FAR/BAR Contract Filler',
  'Counter-Offer Drafter',
  'Property Flyer',
  'Social Post Creator',
  'Lead Follow-Up Texts',
  'Open House Kit (QR + drip)',
  'Inspection Report Summarizer',
  'Buyer FAQ Chatbot',
  'Showing Feedback Collector',
  'CMA Generator',
  'Neighborhood Report',
  'Email Nurture Drip',
  'Contract Deadline Tracker',
];

export default async function Home() {
  const user = await currentUser();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Realva</h1>
      <p className="mt-2 text-lg text-slate-600">The operating system for Florida real estate agents.</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {user ? (
          <Link href="/dashboard" className="inline-flex items-center rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            Open dashboard
          </Link>
        ) : (
          <>
            <Link href="/signup" className="inline-flex items-center rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Start free
            </Link>
            <Link href="/login" className="inline-flex items-center rounded-md border border-slate-900 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50">
              Sign in
            </Link>
          </>
        )}
        <Link href="/pricing" className="inline-flex items-center rounded-md border border-slate-200 px-5 py-2.5 text-sm hover:bg-slate-50">
          Pricing
        </Link>
      </div>

      <h2 className="mt-16 text-lg font-semibold">15 tools, one subscription</h2>
      <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
        {features.map((f) => (
          <li key={f} className="rounded border border-slate-200 px-3 py-2">
            {f}
          </li>
        ))}
      </ul>

      <footer className="mt-20 border-t border-slate-200 pt-6 text-xs text-slate-500">
        realva.velda.ai · Built for Florida realtors.
      </footer>
    </main>
  );
}
