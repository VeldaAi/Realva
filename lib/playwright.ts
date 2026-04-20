/**
 * Playwright helper — fetch + parse pages when an API isn't available.
 * Currently used as a fallback for Neighborhood Reports (crime data pages).
 */
import { chromium, Browser } from 'playwright';

const LAUNCH_ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];

let _browser: Browser | null = null;
async function browser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser;
  _browser = await chromium.launch({ headless: true, args: LAUNCH_ARGS });
  return _browser;
}

export async function fetchRendered(url: string, timeoutMs = 30_000): Promise<string> {
  const ctx = await (await browser()).newContext({ userAgent: 'Mozilla/5.0 Realva/1.0' });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    return await page.content();
  } finally {
    await page.close();
    await ctx.close();
  }
}

export async function closePlaywright() {
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
  }
}
