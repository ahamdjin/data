import { Queue, QueueEvents, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/config/env";
import type { AnyJob } from "./jobs";

export const DATAI_QUEUE_NAME = "datai-jobs";

// Only create a Redis connection when configured. This allows the app to build
// without Redis for tests or environments that don't need background jobs.
let connection: IORedis | undefined;
if (env.server.REDIS_URL) {
  connection = new IORedis(env.server.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export const queue = connection
  ? new Queue<AnyJob>(DATAI_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 1500 },
        removeOnComplete: true,
        removeOnFail: false,
      } as JobsOptions,
    })
  : null;

export const queueEvents = connection
  ? new QueueEvents(DATAI_QUEUE_NAME, { connection })
  : null;

export async function assertQueueHealthy() {
  if (!queue) throw new Error("Queue not configured (missing REDIS_URL)");
  await queue.waitUntilReady();
}
