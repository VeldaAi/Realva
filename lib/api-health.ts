/**
 * Central registry of every external API Realva depends on.
 * Each entry describes:
 *   - the settings keys that configure it (pasted in /admin/apis)
 *   - a ping() that returns green/red status
 *
 * Adding a new API = add one entry here + /admin/apis page picks it up automatically.
 */
import { ping as pingOllama } from './ollama';
import { ping as pingStripe } from './stripe';
import { ping as pingEmail } from './email';
import { ping as pingRentCast } from './rentcast';
import { ping as pingMinio } from './minio';
import { getSetting } from './settings';

export interface ApiDefinition {
  id: string;
  label: string;
  description: string;
  required: boolean;
  keys: { name: string; label: string; placeholder?: string; optional?: boolean; secret?: boolean }[];
  ping: () => Promise<{ ok: boolean; detail: string }>;
}

export const APIS: ApiDefinition[] = [
  {
    id: 'ollama',
    label: 'Ollama (LLM)',
    description: 'Local LLM that powers every AI feature. Run `ollama pull mistral` on your VPS.',
    required: true,
    keys: [
      { name: 'OLLAMA_URL', label: 'URL', placeholder: 'http://host.docker.internal:11434' },
      { name: 'OLLAMA_MODEL', label: 'Model', placeholder: 'mistral' },
    ],
    ping: pingOllama,
  },
  {
    id: 'stripe',
    label: 'Stripe (payments)',
    description: 'Subscriptions + webhooks. Required for anyone to upgrade past the free preview.',
    required: true,
    keys: [
      { name: 'STRIPE_SECRET_KEY', label: 'Secret key', placeholder: 'sk_test_...', secret: true },
      { name: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook signing secret', placeholder: 'whsec_...', secret: true },
      { name: 'STRIPE_PRICE_BASIC', label: 'Price ID — Basic', placeholder: 'price_...' },
      { name: 'STRIPE_PRICE_PRO', label: 'Price ID — Pro', placeholder: 'price_...' },
      { name: 'STRIPE_PRICE_TEAM', label: 'Price ID — Team', placeholder: 'price_...' },
    ],
    ping: pingStripe,
  },
  {
    id: 'resend',
    label: 'Resend (email)',
    description: 'Transactional email for nurture drips, deadline alerts, showing feedback invites.',
    required: true,
    keys: [
      { name: 'RESEND_API_KEY', label: 'API key', placeholder: 're_...', secret: true },
      { name: 'RESEND_FROM_EMAIL', label: 'From address', placeholder: 'notifications@velda.ai' },
    ],
    ping: pingEmail,
  },
  {
    id: 'rentcast',
    label: 'RentCast (comps)',
    description: 'Property comparables for the Comps Puller + CMA features. Free tier available.',
    required: false,
    keys: [{ name: 'RENTCAST_API_KEY', label: 'API key', placeholder: '', secret: true }],
    ping: pingRentCast,
  },
  {
    id: 'minio',
    label: 'MinIO (file storage)',
    description: 'S3-compatible storage for PDFs. Ships with docker-compose, usually no changes needed.',
    required: true,
    keys: [
      { name: 'MINIO_ENDPOINT', label: 'Endpoint', placeholder: 'minio' },
      { name: 'MINIO_PORT', label: 'Port', placeholder: '9000' },
      { name: 'MINIO_USE_SSL', label: 'Use SSL (true/false)', placeholder: 'false' },
      { name: 'MINIO_ROOT_USER', label: 'Access key', placeholder: '', secret: true },
      { name: 'MINIO_ROOT_PASSWORD', label: 'Secret key', placeholder: '', secret: true },
      { name: 'MINIO_BUCKET', label: 'Bucket', placeholder: 'realva-documents' },
      { name: 'MINIO_PUBLIC_URL', label: 'Public URL prefix', placeholder: 'https://realva.velda.ai/files' },
    ],
    ping: pingMinio,
  },
  {
    id: 'census',
    label: 'US Census (neighborhoods)',
    description: 'Demographic data for Neighborhood Reports. Free key.',
    required: false,
    keys: [{ name: 'CENSUS_API_KEY', label: 'API key', placeholder: '', secret: true }],
    ping: async () => {
      const key = await getSetting('CENSUS_API_KEY');
      if (!key) return { ok: false, detail: 'Not set' };
      try {
        const r = await fetch(
          `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=state:12&key=${encodeURIComponent(key)}`,
          { signal: AbortSignal.timeout(5000) },
        );
        return { ok: r.ok, detail: r.ok ? 'Census reachable' : `HTTP ${r.status}` };
      } catch (e) {
        return { ok: false, detail: (e as Error).message };
      }
    },
  },
  {
    id: 'greatschools',
    label: 'GreatSchools (schools)',
    description: 'School ratings for Neighborhood Reports. Optional — degrades to "data unavailable" if absent.',
    required: false,
    keys: [{ name: 'GREATSCHOOLS_API_KEY', label: 'API key', placeholder: '', secret: true }],
    ping: async () => {
      const key = await getSetting('GREATSCHOOLS_API_KEY');
      if (!key) return { ok: false, detail: 'Not set' };
      return { ok: true, detail: 'Key present (no free probe endpoint)' };
    },
  },
];

export async function checkAllApis() {
  return Promise.all(
    APIS.map(async (api) => {
      const status = await api.ping().catch((e) => ({ ok: false, detail: (e as Error).message }));
      return { id: api.id, label: api.label, ...status };
    }),
  );
}
