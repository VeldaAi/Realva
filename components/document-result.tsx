import Link from 'next/link';

export function DocumentResult({
  title,
  url,
  children,
}: {
  title: string;
  url?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {url && (
          <Link
            href={url}
            target="_blank"
            className="rounded border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-50"
          >
            Download PDF ↗
          </Link>
        )}
      </div>
      {children && <div className="mt-3 text-sm">{children}</div>}
    </div>
  );
}
