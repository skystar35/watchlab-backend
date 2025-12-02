
import Fastify from "fastify";
import { videoQueue } from "./queue.js";

const fastify = Fastify({ logger: true });

fastify.get("/", async () => ({ ok: true, message: "WatchLab backend running" }));

fastify.get("/queue/test", async () => {
  const job = await videoQueue.add("demo", { ts: Date.now() });
  return { ok: true, jobId: job.id };
});

const port = process.env.PORT || 8080;

fastify.listen({ port, host: "0.0.0.0" });
