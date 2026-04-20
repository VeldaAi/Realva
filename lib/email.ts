import { Resend } from 'resend';
import { getSetting, requireSetting } from './settings';

let _resend: Resend | null = null;
let _cachedKey: string | null = null;

async function client(): Promise<Resend> {
  const key = await requireSetting('RESEND_API_KEY');
  if (!_resend || _cachedKey !== key) {
    _resend = new Resend(key);
    _cachedKey = key;
  }
  return _resend;
}

export async function sendEmail(opts: { to: string | string[]; subject: string; html: string; from?: string }) {
  const c = await client();
  const from = opts.from ?? (await requireSetting('RESEND_FROM_EMAIL'));
  return c.emails.send({ from, to: opts.to, subject: opts.subject, html: opts.html });
}

export async function ping(): Promise<{ ok: boolean; detail: string }> {
  try {
    const key = await getSetting('RESEND_API_KEY');
    if (!key) return { ok: false, detail: 'RESEND_API_KEY not set' };
    const resp = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (resp.status === 401) return { ok: false, detail: 'Invalid API key' };
    if (!resp.ok) return { ok: false, detail: `HTTP ${resp.status}` };
    return { ok: true, detail: 'Resend reachable' };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}
