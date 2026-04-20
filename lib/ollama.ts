/**
 * Ollama wrapper. 3x retry per spec; streaming disabled for DB persistence.
 * URL + model read at call time so /admin/apis hot-swaps without restart.
 */
import { getSetting } from './settings';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  temperature?: number;
  json?: boolean;
  model?: string;
  timeoutMs?: number;
}

async function config() {
  const url = (await getSetting('OLLAMA_URL')) ?? 'http://host.docker.internal:11434';
  const model = (await getSetting('OLLAMA_MODEL')) ?? 'mistral';
  return { url, model };
}

export async function chat(messages: ChatMessage[], opts: GenerateOptions = {}): Promise<string> {
  const { url, model: defaultModel } = await config();
  const model = opts.model ?? defaultModel;
  const timeoutMs = opts.timeoutMs ?? 120_000;

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: false,
    options: { temperature: opts.temperature ?? 0.7 },
  };
  if (opts.json) body.format = 'json';

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`Ollama ${resp.status}: ${await resp.text().catch(() => '')}`);
      const data = (await resp.json()) as { message?: { content?: string } };
      const content = data.message?.content?.trim();
      if (!content) throw new Error('Ollama returned empty completion');
      return content;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
    }
  }
  throw new Error(`Ollama call failed after 3 attempts: ${(lastErr as Error).message}`);
}

export async function chatJson<T>(messages: ChatMessage[], opts: GenerateOptions = {}): Promise<T> {
  const raw = await chat(messages, { ...opts, json: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Ollama returned non-JSON: ${raw.slice(0, 200)}`);
    return JSON.parse(match[0]) as T;
  }
}

/** Health probe — used by /admin/apis red/green indicator. */
export async function ping(): Promise<{ ok: boolean; detail: string }> {
  try {
    const { url } = await config();
    const resp = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return { ok: false, detail: `HTTP ${resp.status}` };
    return { ok: true, detail: 'Ollama reachable' };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}
