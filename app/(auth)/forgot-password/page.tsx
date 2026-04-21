'use client';
import Link from 'next/link';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');
    setError(null);
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '/reset-password';
    const result = await authClient.forgetPassword({ email, redirectTo });
    if (result.error) {
      setError(result.error.message ?? 'Could not start password reset');
      setState('error');
      return;
    }
    setState('sent');
  }

  return (
    <>
      <h1 className="mb-2 text-xl font-semibold">Forgot your password?</h1>
      <p className="mb-6 text-sm text-slate-600">
        Enter your email. If the account exists, we'll send a reset link.
      </p>

      {state === 'sent' ? (
        <div className="space-y-4">
          <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <strong>Reset link sent.</strong> Check your inbox (and spam folder) for a message from
            Realva. The link expires in 1 hour.
          </div>
          <p className="text-xs text-slate-600">
            Not receiving the email? If your admin hasn't configured outbound email yet, ask them
            to check <code className="rounded bg-slate-100 px-1">docker logs realva-app-1</code> —
            the reset link is also logged there as a fallback.
          </p>
          <Link href="/login" className="block text-center text-sm font-medium text-slate-900 underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={state === 'loading'}
            className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {state === 'loading' ? 'Sending...' : 'Send reset link'}
          </button>
          <p className="text-center text-xs text-slate-600">
            <Link href="/login" className="font-medium text-slate-900 underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </>
  );
}
