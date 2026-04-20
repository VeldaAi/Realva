import { APIS } from '@/lib/api-health';
import { getSetting } from '@/lib/settings';
import { ApiCard } from './ApiCard';

export const dynamic = 'force-dynamic';

export default async function AdminApisPage() {
  const data = await Promise.all(
    APIS.map(async (api) => {
      const values: Record<string, string> = {};
      for (const k of api.keys) {
        const v = await getSetting(k.name);
        values[k.name] = v ?? '';
      }
      const status = await api.ping().catch((e) => ({ ok: false, detail: (e as Error).message }));
      return { api, values, status };
    }),
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <p className="mt-1 text-sm text-slate-600">
          Paste keys, hit Save. A green dot means Realva can talk to that service right now. Red
          means either the key is missing, invalid, or the service is unreachable.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Keys are stored in your Postgres DB (encrypted at rest if{' '}
          <code className="rounded bg-slate-100 px-1 font-mono">SETTING_ENCRYPTION_KEY</code> is
          set in your .env file — otherwise plain text).
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.map(({ api, values, status }) => (
          <ApiCard key={api.id} api={api} initialValues={values} initialStatus={status} />
        ))}
      </div>
    </div>
  );
}
