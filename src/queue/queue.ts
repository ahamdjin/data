import { Queue, QueueEvents, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/config/env";
import type { AnyJob } from "./jobs";

const connection = new IORedis(env.server.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const DATAI_QUEUE_NAME = "datai-jobs";

export const queue = new Queue<AnyJob>(DATAI_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1500 },
    removeOnComplete: true,
    removeOnFail: false,
  } as JobsOptions,
});

export const queueEvents = new QueueEvents(DATAI_QUEUE_NAME, { connection });

export async function assertQueueHealthy() {
  await queue.waitUntilReady();
}
