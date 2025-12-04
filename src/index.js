// src/index.js
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import { videoQueue } from "./queue.js";

const fastify = Fastify({ logger: true });

// CORS
await fastify.register(fastifyCors, {
  origin: "*",
});

// ───────────────────────────
// Health Check
// ───────────────────────────
fastify.get("/", async () => {
  return { ok: true, message: "WatchLab backend is running" };
});

// ───────────────────────────
// Test Route  (kalsın, debug için)
// ───────────────────────────
fastify.get("/queue/test", async () => {
  const job = await videoQueue.add("demo", { ts: Date.now() });
  return { ok: true, jobID: job.id };
});

// ───────────────────────────
// Eski Enqueue Route  (uyumluluk için)
// ───────────────────────────
fastify.post("/enqueue", async (request, reply) => {
  const { note } = request.body ?? {};

  const job = await videoQueue.add("generate-video", {
    note,
    ts: Date.now(),
  });

  return { ok: true, jobID: job.id };
});

// ───────────────────────────
// YENİ: WatchLab / TrendMaker API
// ───────────────────────────

// 1) Render job oluştur (frontend burayı kullanacak)
fastify.post("/v1/automontage/render", async (request, reply) => {
  try {
    const { videoUrl, duration } = request.body ?? {};

    if (!videoUrl) {
      reply.code(400);
      return { ok: false, message: "videoUrl zorunlu" };
    }

    const job = await videoQueue.add("automontage-render", {
      videoUrl,
      duration: duration ?? 5,
      createdAt: Date.now(),
    });

    return { ok: true, jobId: job.id };
  } catch (err) {
    fastify.log.error(err);
    reply.code(500);
    return { ok: false, message: "Render kuyruğa eklenemedi" };
  }
});

// 2) Job durumunu getir (REST tarzı)
fastify.get("/v1/automontage/status/:id", async (request, reply) => {
  try {
    const { id } = request.params;
    const job = await videoQueue.getJob(id);

    if (!job) {
      reply.code(404);
      return { ok: false, status: "not_found" };
    }

    const state = await job.getState(); // waiting, active, completed, failed
    const progress = job.progress ?? 0;
    const result = job.returnvalue ?? null;

    return {
      ok: true,
      jobId: job.id,
      status: state,
      progress,
      result,
    };
  } catch (err) {
    fastify.log.error(err);
    reply.code(500);
    return { ok: false, message: "Durum sorgulanamadı" };
  }
});

// 3) Aynı işi eski path ile de sun (GET /queue/status/:id)
//    Böylece senin şu an test ettiğin URL de çalışacak.
fastify.get("/queue/status/:id", async (request, reply) => {
  try {
    const { id } = request.params;
    const job = await videoQueue.getJob(id);

    if (!job) {
      reply.code(404);
      return { ok: false, message: "Job not found" };
    }

    const state = await job.getState();
    const progress = job.progress ?? 0;
    const result = job.returnvalue ?? null;

    return {
      ok: true,
      jobId: job.id,
      status: state,
      progress,
      result,
    };
  } catch (err) {
    fastify.log.error(err);
    reply.code(500);
    return { ok: false, message: "Durum sorgulanamadı" };
  }
});

// ───────────────────────────
// Server Start
// ───────────────────────────
const port = process.env.PORT || 8080;

try {
  await fastify.listen({ port, host: "0.0.0.0" });
  fastify.log.info(`Server listening on ${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
