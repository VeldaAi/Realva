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

// ─── deadlines (nightly cron) ─────────────────────────────
new Worker(
  QUEUES.deadlines,
  async () => {
    const soon = new Date(Date.now() + 72 * 3600_000);
    const deadlines = await prisma.deadline.findMany({
      where: { completed: false, notifiedAt: null, dueDate: { lte: soon } },
      include: { user: true, property: true },
    });
    for (const d of deadlines) {
      await sendEmail({
        to: d.user.email,
        subject: `Deadline reminder: ${d.label}`,
        html: `<p>Hi ${d.user.email},</p><p><strong>${d.label}</strong> is due ${d.dueDate.toDateString()}${d.property ? ` for ${d.property.address}` : ''}.</p>`,
      });
      await prisma.deadline.update({ where: { id: d.id }, data: { notifiedAt: new Date() } });
    }
  },
  { connection, concurrency: 1 },
).on('ready', () => logWorker(QUEUES.deadlines));

// ─── nightly deadline cron ────────────────────────────────
// Queue a "deadlines" job every 6 hours. The handler is idempotent (it
// skips anything already notifiedAt != null) so duplicate triggers are safe.
import { queue } from '../lib/queues';
const cronQueue = queue(QUEUES.deadlines);
await cronQueue.upsertJobScheduler(
  'deadline-sweep',
  { every: 6 * 60 * 60 * 1000 },
  { name: 'sweep', data: {} },
).catch(() => {});

process.on('SIGTERM', async () => {
  await closeBrowser();
  await closePlaywright();
  process.exit(0);
});

console.log('[worker] started');
