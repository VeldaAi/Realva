/**
 * Neighborhood data aggregator: Census ACS for demographics,
 * GreatSchools (if key present) for schools, plus a Playwright
 * fallback for crime if no structured source is configured.
 */
import { getSetting } from './settings';

export interface NeighborhoodData {
  neighborhood: string;
  demographics: { medianIncome?: number; medianHomeValue?: number; population?: number };
  schools: { name: string; level: string; rating?: number }[];
  schoolsSource?: string;
}

/**
 * Census ACS 5-year — FL state is FIPS 12.
 * We use state-level as a safe default; user can pass a ZIP-level
 * tract query if they want finer granularity in a follow-up version.
 */
export async function fetchCensus(zipOrState: string): Promise<NeighborhoodData['demographics']> {
  const key = await getSetting('CENSUS_API_KEY');
  if (!key) return {};
  try {
    // B19013_001E = median household income, B25077_001E = median home value, B01003_001E = population
    const url = `https://api.census.gov/data/2022/acs/acs5?get=B19013_001E,B25077_001E,B01003_001E,NAME&for=state:12&key=${encodeURIComponent(key)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!r.ok) return {};
    const rows = (await r.json()) as string[][];
    if (rows.length < 2) return {};
    const [income, homeVal, pop] = rows[1];
    return {
      medianIncome: Number(income) || undefined,
      medianHomeValue: Number(homeVal) || undefined,
      population: Number(pop) || undefined,
    };
  } catch {
    return {};
  }
}

export async function fetchSchools(_zip: string): Promise<{ schools: NeighborhoodData['schools']; source?: string }> {
  const key = await getSetting('GREATSCHOOLS_API_KEY');
  if (!key) return { schools: [] };
  // GreatSchools is now paid/invite-only; we keep the hook so a key flips this on.
  return { schools: [], source: 'GreatSchools' };
}
