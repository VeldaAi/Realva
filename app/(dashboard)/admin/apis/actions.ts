'use server';
import { revalidatePath } from 'next/cache';
import { APIS } from '@/lib/api-health';
import { clearSetting, setSetting } from '@/lib/settings';
import { requireAdmin } from '@/lib/auth-helpers';

export async function saveApiKeys(apiId: string, formData: FormData) {
  const admin = await requireAdmin();
  const api = APIS.find((a) => a.id === apiId);
  if (!api) throw new Error('Unknown API');

  for (const k of api.keys) {
    const value = String(formData.get(k.name) ?? '').trim();
    if (value === '') {
      await clearSetting(k.name);
    } else {
      await setSetting(k.name, value, admin.email);
    }
  }

  revalidatePath('/admin/apis');
  return { ok: true };
}

export async function pingApi(apiId: string) {
  await requireAdmin();
  const api = APIS.find((a) => a.id === apiId);
  if (!api) return { ok: false, detail: 'Unknown API' };
  return api.ping();
}
