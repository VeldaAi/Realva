/**
 * LLM client — targets DeepSeek (OpenAI-compatible chat completions).
 * File name is kept as ollama.ts so the 15 feature modules don't need
 * to change their imports. The exported API is identical.
 *
 * DeepSeek endpoint: https://api.deepseek.com/v1/chat/completions
 * Model: deepseek-chat
 * Key is read from Settings (pasted via /admin/apis) with .env fallback.
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

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';

async function apiKey(): Promise<string> {
  const k = await getSetting('DEEPSEEK_API_KEY');
  if (!k) throw new Error('Missing DEEPSEEK_API_KEY — paste it in /admin/apis');
  return k;
}

export async function chat(messages: ChatMessage[], opts: GenerateOptions = {}): Promise<string> {
  const key = await apiKey();
  const model = opts.model ?? DEFAULT_MODEL;
  const timeoutMs = opts.timeoutMs ?? 120_000;

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: false,
    temperature: opts.temperature ?? 0.7,
  };
  if (opts.json) body.response_format = { type: 'json_object' };

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (resp.status === 429 || resp.status >= 500) {
        throw new Error(`DeepSeek ${resp.status} (retryable): ${await resp.text().catch(() => '')}`);
      }
      if (!resp.ok) throw new Error(`DeepSeek ${resp.status}: ${await resp.text().catch(() => '')}`);
      const data = (await resp.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error('DeepSeek returned empty completion');
      return content;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
    }
  }
  throw new Error(`DeepSeek call failed after 3 attempts: ${(lastErr as Error).message}`);
}

export async function chatJson<T>(messages: ChatMessage[], opts: GenerateOptions = {}): Promise<T> {
  const raw = await chat(messages, { ...opts, json: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    // DeepSeek with response_format usually returns clean JSON. Fallback anyway.
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`DeepSeek returned non-JSON: ${raw.slice(0, 200)}`);
    return JSON.parse(match[0]) as T;
  }
}

/** Health probe for /admin/apis red/green dot. */
export async function ping(): Promise<{ ok: boolean; detail: string }> {
  try {
    const key = await getSetting('DEEPSEEK_API_KEY');
    if (!key) return { ok: false, detail: 'DEEPSEEK_API_KEY not set' };
    // Minimal 1-token call to verify the key + reachability
    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        stream: false,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (resp.status === 401) return { ok: false, detail: 'Invalid API key' };
    if (!resp.ok) return { ok: false, detail: `HTTP ${resp.status}` };
    return { ok: true, detail: 'DeepSeek reachable' };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}
