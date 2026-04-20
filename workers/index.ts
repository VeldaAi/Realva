/**
 * BullMQ worker entrypoint. Runs in its own container (Dockerfile.worker).
 * Each queue handler is deliberately small — delegate to lib/* modules.
 */
import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '../lib/db';
import { QUEUES } from '../lib/queues';
import { sendEmail } from '../lib/email';
import { closeBrowser } from '../lib/pdf';
import { closePlaywright } from '../lib/playwright';

const connection = redis;

function logWorker(name: string) {
  console.log(`[worker] queue=${name} ready`);
}

// ─── email ────────────────────────────────────────────────
new Worker(
  QUEUES.email,
  async (job: Job<{ to: string; subject: string; html: string }>) => {
    await sendEmail(job.data);
  },
  { connection, concurrency: 8 },
).on('ready', () => logWorker(QUEUES.email));

// ─── sequence (delayed nurture emails) ────────────────────
new Worker(
  QUEUES.sequence,
  async (job: Job<{ sequenceId: string }>) => {
    const seq = await prisma.emailSequence.findUnique({
      where: { id: job.data.sequenceId },
      include: { lead: true },
    });
    if (!seq || seq.sentAt || seq.cancelled || !seq.lead.email) return;
    await sendEmail({ to: seq.lead.email, subject: seq.subject, html: seq.bodyHtml });
    await prisma.emailSequence.update({ where: { id: seq.id }, data: { sentAt: new Date() } });
  },
  { connection, concurrency: 4 },
).on('ready', () => logWorker(QUEUES.sequence));

// ─── deadline sweep (runs every 6 hours) ──────────────────
async function sweepDeadlines() {
  const soon = new Date(Date.now() + 72 * 3600_000);
  const deadlines = await prisma.deadline.findMany({
    where: { completed: false, notifiedAt: null, dueDate: { lte: soon } },
    include: { user: true, property: true },
  });
  for (const d of deadlines) {
    try {
      await sendEmail({
        to: d.user.email,
        subject: `Deadline reminder: ${d.label}`,
        html: `<p>Hi ${d.user.email},</p><p><strong>${d.label}</strong> is due ${d.dueDate.toDateString()}${d.property ? ` for ${d.property.address}` : ''}.</p>`,
      });
      await prisma.deadline.update({ where: { id: d.id }, data: { notifiedAt: new Date() } });
    } catch (err) {
      console.error('[worker] deadline sweep send failed:', err);
    }
  }
  if (deadlines.length > 0) console.log(`[worker] swept ${deadlines.length} deadlines`);
}

// Run immediately on boot, then every 6 hours.
sweepDeadlines().catch((e) => console.error('[worker] initial sweep failed:', e));
setInterval(
  () => sweepDeadlines().catch((e) => console.error('[worker] sweep failed:', e)),
  6 * 60 * 60 * 1000,
);

process.on('SIGTERM', async () => {
  await closeBrowser();
  await closePlaywright();
  process.exit(0);
});

console.log('[worker] started');
