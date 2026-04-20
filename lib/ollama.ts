/**
 * Ollama wrapper — runs against a local/host Ollama instance.
 * 2x retry per spec; streaming disabled (we want full completions for DB persistence).
 */
import { env, envOptional } from './env';

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

export async function chat(messages: ChatMessage[], opts: GenerateOptions = {}): Promise<string> {
  const url = envOptional('OLLAMA_URL') ?? 'http://host.docker.internal:11434';
  const model = opts.model ?? envOptional('OLLAMA_MODEL') ?? 'mistral';
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
    // Fallback — extract the first {...} block
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Ollama returned non-JSON: ${raw.slice(0, 200)}`);
    return JSON.parse(match[0]) as T;
  }
}
