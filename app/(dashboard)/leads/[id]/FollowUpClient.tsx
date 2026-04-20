'use client';
import { useState, useTransition } from 'react';
import { generateFollowUp } from '../actions';

interface Variants {
  friendly: string;
  urgent: string;
  professional: string;
}

export function FollowUpClient({ leadId, previous }: { leadId: string; previous: { id: string; content: Variants }[] }) {
  const [pending, start] = useTransition();
  const [variants, setVariants] = useState<Variants | null>(previous[0]?.content ?? null);

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setVariants(await generateFollowUp(leadId)))}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? 'Writing...' : variants ? 'Regenerate follow-up' : 'Generate follow-up texts'}
      </button>

      {variants && (
        <div className="mt-4 space-y-3">
          <Card label="Friendly" text={variants.friendly} />
          <Card label="Urgent" text={variants.urgent} />
          <Card label="Professional" text={variants.professional} />
        </div>
      )}
    </div>
  );
}

function Card({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <p className="text-sm text-slate-800">{text}</p>
    </div>
  );
}
