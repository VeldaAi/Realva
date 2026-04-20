'use client';
import { useState, useTransition, useRef, useEffect } from 'react';
import { askBot } from './actions';

interface Msg { role: 'user' | 'assistant'; content: string }

export function ChatUI() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! Ask me anything about buying a home in Florida — closing costs, homestead exemption, hurricane insurance, HOA rules." },
  ]);
  const [input, setInput] = useState('');
  const [pending, start] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput('');
    const next = [...messages, { role: 'user' as const, content: q }];
    setMessages(next);
    start(async () => {
      const answer = await askBot(next);
      setMessages((cur) => [...cur, { role: 'assistant', content: answer }]);
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div ref={scrollRef} className="h-[500px] overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div key={i} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {pending && <div className="text-sm text-slate-500">Thinking...</div>}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          disabled={pending}
        />
        <button type="submit" disabled={pending} className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}
