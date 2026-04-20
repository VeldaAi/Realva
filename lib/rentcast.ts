import { getSetting, requireSetting } from './settings';

export interface Comp {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  yearBuilt?: number;
  lastSaleDate?: string;
  distanceMiles?: number;
  daysOnMarket?: number;
  pricePerSqft?: number;
}

const BASE = 'https://api.rentcast.io/v1';

async function call<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const key = await requireSetting('RENTCAST_API_KEY');
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  const resp = await fetch(`${BASE}${path}?${qs}`, {
    headers: { 'X-Api-Key': key, accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!resp.ok) throw new Error(`RentCast ${resp.status}: ${await resp.text().catch(() => '')}`);
  return (await resp.json()) as T;
}

export async function fetchComps(address: string, radius = 1): Promise<Comp[]> {
  type Row = {
    id: string;
    formattedAddress: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    yearBuilt?: number;
    lastSaleDate?: string;
    distance?: number;
    daysOnMarket?: number;
  };
  const data = await call<{ comparables?: Row[] }>('/avm/value', { address, compCount: 5, radius });
  const rows = data.comparables ?? [];
  return rows.map((r) => ({
    id: r.id,
    address: r.formattedAddress,
    price: r.price ?? 0,
    bedrooms: r.bedrooms ?? 0,
    bathrooms: r.bathrooms ?? 0,
    squareFootage: r.squareFootage ?? 0,
    yearBuilt: r.yearBuilt,
    lastSaleDate: r.lastSaleDate,
    distanceMiles: r.distance,
    daysOnMarket: r.daysOnMarket,
    pricePerSqft: r.squareFootage && r.price ? Math.round(r.price / r.squareFootage) : undefined,
  }));
}

export async function ping(): Promise<{ ok: boolean; detail: string }> {
  try {
    const key = await getSetting('RENTCAST_API_KEY');
    if (!key) return { ok: false, detail: 'RENTCAST_API_KEY not set' };
    const resp = await fetch(`${BASE}/avm/value?address=1%20Infinite%20Loop%20Cupertino%20CA`, {
      headers: { 'X-Api-Key': key },
      signal: AbortSignal.timeout(5000),
    });
    if (resp.status === 401 || resp.status === 403) return { ok: false, detail: 'Invalid API key' };
    return { ok: true, detail: `RentCast responded ${resp.status}` };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}
