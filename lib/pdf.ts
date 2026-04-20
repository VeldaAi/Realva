/**
 * PDF rendering pipeline.
 * Flow: Handlebars template + user branding → HTML → Puppeteer → Buffer → MinIO.
 * Every template supports {{branding.*}} and {{#if watermark}} for tier gating.
 */
import Handlebars from 'handlebars';
import puppeteer, { Browser, LaunchOptions } from 'puppeteer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { User } from '@prisma/client';
import { makeObjectKey, putObject } from './minio';
import { resolveBranding, type Branding } from './branding';

const LAUNCH_OPTS: LaunchOptions = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
};

let _browser: Browser | null = null;
async function browser(): Promise<Browser> {
  if (_browser && _browser.connected) return _browser;
  _browser = await puppeteer.launch(LAUNCH_OPTS);
  return _browser;
}

const COMPILED = new Map<string, HandlebarsTemplateDelegate>();
async function compile(relPath: string): Promise<HandlebarsTemplateDelegate> {
  if (COMPILED.has(relPath)) return COMPILED.get(relPath)!;
  const full = path.join(process.cwd(), 'templates', relPath);
  const src = await readFile(full, 'utf8');
  const fn = Handlebars.compile(src, { noEscape: false });
  COMPILED.set(relPath, fn);
  return fn;
}

Handlebars.registerHelper('ifEquals', function (this: unknown, a: unknown, b: unknown, opts: Handlebars.HelperOptions) {
  return a === b ? opts.fn(this) : opts.inverse(this);
});
Handlebars.registerHelper('money', (n: number | string) => {
  const v = typeof n === 'string' ? Number(n) : n;
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
});
Handlebars.registerHelper('date', (d: Date | string) => {
  const v = typeof d === 'string' ? new Date(d) : d;
  return v.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
});

export interface RenderPdfOptions {
  template: string;     // e.g. "flyer.html"
  data: Record<string, unknown>;
  user: User;
  keyPrefix: string;    // MinIO prefix, e.g. "flyers"
  filename?: string;
}

export async function renderPdf(opts: RenderPdfOptions): Promise<{ url: string; bytes: number }> {
  const branding: Branding = resolveBranding(opts.user);
  const watermark = opts.user.plan === 'BASIC';

  const tpl = await compile(opts.template);
  const html = tpl({ ...opts.data, branding, watermark, generatedAt: new Date() });

  const b = await browser();
  const page = await b.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({ format: 'Letter', printBackground: true, margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' } });
    const buf = Buffer.from(buffer);
    const key = makeObjectKey(opts.keyPrefix, 'pdf');
    const url = await putObject(key, buf, 'application/pdf');
    return { url, bytes: buf.length };
  } finally {
    await page.close();
  }
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
  }
}
