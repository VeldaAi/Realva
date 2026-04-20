import { Queue, QueueEvents } from 'bullmq';
import { redis } from './redis';

export const QUEUES = {
  pdf: 'pdf',                  // render a PDF for a Document
  email: 'email',              // send a transactional email now
  sequence: 'sequence',        // send a scheduled nurture-sequence email
  deadlines: 'deadlines',      // nightly cron → alert T-minus deadlines
  feedbackDigest: 'feedback',  // summarize showing feedback with Ollama
} as const;

type QueueName = typeof QUEUES[keyof typeof QUEUES];

const _queues = new Map<QueueName, Queue>();
export function queue(name: QueueName): Queue {
  let q = _queues.get(name);
  if (!q) {
    q = new Queue(name, { connection: redis, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 200, removeOnFail: 500 } });
    _queues.set(name, q);
  }
  return q;
}

const _events = new Map<QueueName, QueueEvents>();
export function events(name: QueueName): QueueEvents {
  let e = _events.get(name);
  if (!e) {
    e = new QueueEvents(name, { connection: redis });
    _events.set(name, e);
  }
  return e;
}
