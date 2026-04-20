import { requireUser } from '@/lib/auth-helpers';
import { saveProfile } from './actions';

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold">Profile & branding</h1>
      <p className="mt-1 text-sm text-slate-600">
        These fields appear on every PDF, flyer, and CMA you generate.
      </p>

      <form action={saveProfile} className="mt-6 space-y-5 rounded-lg border border-slate-200 bg-white p-6">
        <Field label="Email (login)" name="email" value={user.email} disabled />
        <Field label="Phone" name="phone" value={user.phone ?? ''} placeholder="(305) 555-0100" />
        <Field label="Website" name="website" value={user.website ?? ''} placeholder="https://your-site.com" />
        <Field label="License number" name="licenseNumber" value={user.licenseNumber ?? ''} placeholder="BK-3000000" />

        <div className="border-t border-slate-200 pt-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Branding (shown on PDFs)
          </h2>
          <Field label="Headshot URL" name="headshotUrl" value={user.headshotUrl ?? ''} placeholder="https://.../headshot.jpg" />
          <Field label="Logo URL" name="logoUrl" value={user.logoUrl ?? ''} placeholder="https://.../logo.png" />
          <div>
            <label className="mb-1 block text-sm font-medium">Brand color</label>
            <input
              name="brandColor"
              type="color"
              defaultValue={user.brandColor ?? '#0f172a'}
              className="h-10 w-20 rounded border border-slate-300"
            />
          </div>
          <Field
            label="Footer disclaimer"
            name="footerDisclaimer"
            value={user.footerDisclaimer ?? ''}
            textarea
            placeholder="Licensed Florida real estate professional..."
          />
        </div>

        <button
          type="submit"
          className="rounded bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Save
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  placeholder,
  disabled,
  textarea,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={value}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-slate-50"
        />
      ) : (
        <input
          name={name}
          type="text"
          defaultValue={value}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-slate-50"
        />
      )}
    </div>
  );
}
