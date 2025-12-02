
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

export const videoQueue = new Queue("videoQueue", { connection });

console.log("✅ videoQueue initialized");
