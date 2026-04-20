import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth-helpers';

export default async function SocialDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const doc = await prisma.document.findFirst({ where: { id, userId: user.id, type: 'SOCIAL_POST' } });
  if (!doc) notFound();
  const c = doc.contentJson as {
    variants: {
      instagram: { caption: string; hashtags: string[] };
      facebook: { caption: string };
      linkedin: { caption: string };
    };
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={doc.title} description="Copy each variant into the matching platform." />
      <Variant label="Instagram" text={`${c.variants.instagram.caption}\n\n${c.variants.instagram.hashtags.join(' ')}`} />
      <Variant label="Facebook" text={c.variants.facebook.caption} />
      <Variant label="LinkedIn" text={c.variants.linkedin.caption} />
    </div>
  );
}

function Variant({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</h3>
      </div>
      <pre className="whitespace-pre-wrap text-sm text-slate-800">{text}</pre>
    </div>
  );
}
