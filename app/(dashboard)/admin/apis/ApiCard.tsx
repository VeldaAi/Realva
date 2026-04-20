'use client';
import { useState, useTransition } from 'react';
import { saveApiKeys, pingApi } from './actions';
import type { ApiDefinition } from '@/lib/api-health';

interface Props {
  api: Pick<ApiDefinition, 'id' | 'label' | 'description' | 'required' | 'keys'>;
  initialValues: Record<string, string>;
  initialStatus: { ok: boolean; detail: string };
}

export function ApiCard({ api, initialValues, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [values, setValues] = useState(initialValues);
  const [saving, startSaving] = useTransition();
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  function handleSave(formData: FormData) {
    startSaving(async () => {
      setSavedMsg(null);
      const result = await saveApiKeys(api.id, formData);
      if (result.ok) {
        setSavedMsg('Saved. Re-checking...');
        const s = await pingApi(api.id);
        setStatus(s);
        setSavedMsg(s.ok ? 'Saved + connected ✓' : `Saved, but: ${s.detail}`);
        setTimeout(() => setSavedMsg(null), 5000);
      }
    });
  }

  async function handleRetest() {
    setSavedMsg('Checking...');
    const s = await pingApi(api.id);
    setStatus(s);
    setSavedMsg(null);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${status.ok ? 'bg-green-500' : 'bg-red-500'}`}
              title={status.ok ? 'Connected' : 'Not connected'}
              aria-label={status.ok ? 'Connected' : 'Not connected'}
            />
            <h3 className="text-base font-semibold">{api.label}</h3>
            {api.required && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                Required
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">{api.description}</p>
          <p className="mt-1 text-xs font-mono text-slate-500">{status.detail}</p>
        </div>
        <button
          type="button"
          onClick={handleRetest}
          className="rounded border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-50"
        >
          Retest
        </button>
      </div>

      <form action={handleSave} className="mt-4 space-y-3">
        {api.keys.map((k) => (
          <div key={k.name}>
            <label className="mb-1 flex items-center justify-between text-xs font-medium">
              <span>{k.label}</span>
              <span className="font-mono text-slate-400">{k.name}</span>
            </label>
            <input
              name={k.name}
              type={k.secret ? 'password' : 'text'}
              defaultValue={values[k.name] ?? ''}
              placeholder={k.placeholder}
              autoComplete="off"
              className="w-full rounded border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-900 focus:outline-none"
              onChange={(e) => setValues((v) => ({ ...v, [k.name]: e.target.value }))}
            />
          </div>
        ))}
        <div className="flex items-center justify-between pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {savedMsg && <span className="text-xs text-slate-600">{savedMsg}</span>}
        </div>
      </form>
    </div>
  );
}
