import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import { videoQueue } from "./queue.js";

const fastify = Fastify({ logger: true });

// CORS
await fastify.register(fastifyCors, {
  origin: "*",
});

// Health check
fastify.get("/", async () => ({ ok: true, message: "WatchLab backend running" }));

// Test Route
fastify.get("/queue/test", async () => {
  const job = await videoQueue.add("demo", { ts: Date.now() });
  return { ok: true, jobID: job.id };
});

// MAIN ENQUEUE ROUTE  ← ← ← EKSİK OLAN BUYDU!
fastify.post("/enqueue", async (request, reply) => {
  const { note } = request.body;

  const job = await videoQueue.add("generate-video", {
    note,
    ts: Date.now(),
  });

  return { ok: true, jobID: job.id };
});

// Start server
const port = process.env.PORT || 8080;
fastify.listen({ port, host: "0.0.0.0" });
