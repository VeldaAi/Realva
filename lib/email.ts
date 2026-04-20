import { Resend } from 'resend';
import { env } from './env';

let _resend: Resend | null = null;
function client(): Resend {
  if (!_resend) _resend = new Resend(env('RESEND_API_KEY'));
  return _resend;
}

export async function sendEmail(opts: { to: string | string[]; subject: string; html: string; from?: string }) {
  return client().emails.send({
    from: opts.from ?? env('RESEND_FROM_EMAIL'),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
