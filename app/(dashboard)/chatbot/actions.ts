'use server';
import { requireUser } from '@/lib/auth-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { chat } from '@/lib/ollama';
import { buyerFaqSystem } from '@/lib/prompts';

export async function askBot(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
  const user = await requireUser();
  const rl = await rateLimit(user.id, 'chatbot');
  if (!rl.allowed) return 'Rate limit hit. Try again next hour.';

  const answer = await chat(
    [
      { role: 'system', content: buyerFaqSystem() },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    { temperature: 0.3 },
  );
  return answer;
}
