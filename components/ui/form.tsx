export function Field({
  label,
  name,
  type = 'text',
  placeholder,
  required,
  defaultValue,
  textarea,
  rows = 3,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number;
  textarea?: boolean;
  rows?: number;
  hint?: string;
}) {
  const cls =
    'w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none';
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {textarea ? (
        <textarea name={name} rows={rows} placeholder={placeholder} required={required} defaultValue={defaultValue as string | undefined} className={cls} />
      ) : (
        <input name={name} type={type} placeholder={placeholder} required={required} defaultValue={defaultValue} className={cls} />
      )}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SubmitButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      className={`rounded bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
