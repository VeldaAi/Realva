export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <a href="/" className="mb-8 text-2xl font-bold tracking-tight text-slate-900">
        Realva
      </a>
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
