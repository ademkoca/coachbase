import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { db } from "./db/client.js";
import { trainers } from "./db/schema.js";

import clientsRouter from "./routes/clients.js";
import exercisesRouter from "./routes/exercises.js";
import workoutPlansRouter from "./routes/workoutPlans.js";
import groupsRouter from "./routes/groups.js";
import sessionsRouter from "./routes/sessions.js";
import progressRouter from "./routes/progress.js";
import paymentsRouter from "./routes/payments.js";
import workoutLogsRouter from "./routes/workoutLogs.js";
import metricsRouter from "./routes/metrics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Firebase sign-up happens on the client; after that the client calls this endpoint
// with the resulting token to upsert the trainer row in our DB.
app.post("/api/auth/register", requireAuth, async (req, res, next) => {
  try {
    const { email, displayName } = req.body;
    await db
      .insert(trainers)
      .values({ id: req.trainerId, email, displayName })
      .onConflictDoUpdate({
        target: trainers.id,
        set: { email, displayName },
      });
    res.json({ id: req.trainerId, email, displayName });
  } catch (e) {
    next(e);
  }
});

app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try {
    const { eq } = await import("drizzle-orm");
    const [trainer] = await db
      .select()
      .from(trainers)
      .where(eq(trainers.id, req.trainerId));
    if (!trainer) return res.status(404).json({ error: "Trainer not found" });
    res.json(trainer);
  } catch (e) {
    next(e);
  }
});

app.patch("/api/auth/me", requireAuth, async (req, res, next) => {
  try {
    const { eq } = await import("drizzle-orm");
    const { displayName, phone, bio, weightUnit, measurementUnit, feePerSession, feeMonthly, feeHalfYearly, feeYearly, staleClientThresholdDays, currency } = req.body;
    const [trainer] = await db
      .update(trainers)
      .set({ displayName, phone, bio, weightUnit, measurementUnit, feePerSession, feeMonthly, feeHalfYearly, feeYearly, staleClientThresholdDays, currency })
      .where(eq(trainers.id, req.trainerId))
      .returning();
    if (!trainer) return res.status(404).json({ error: "Trainer not found" });
    res.json(trainer);
  } catch (e) {
    next(e);
  }
});

app.use("/api/clients", requireAuth, clientsRouter);
app.use("/api/clients/:clientId/progress", requireAuth, progressRouter);
app.use("/api/clients/:clientId/payments", requireAuth, paymentsRouter);

// Expiring payments — must be mounted before /:clientId scoped payments route
app.get("/api/payments/expiring", requireAuth, async (req, res, next) => {
  try {
    const { listExpiringPayments } = await import("./services/paymentsService.js");
    res.json(await listExpiringPayments(req.trainerId));
  } catch (e) { next(e); }
});

// Bulk coverage check for multiple clients at once (used by session creation modal)
app.post("/api/payments/coverage-check", requireAuth, async (req, res, next) => {
  try {
    const { checkCoverageForClients } = await import("./services/paymentsService.js");
    const { clientIds, date } = req.body as { clientIds: string[]; date: string };
    if (!clientIds?.length || !date) return res.status(400).json({ error: "clientIds and date required" });
    res.json(await checkCoverageForClients(req.trainerId, clientIds, date));
  } catch (e) { next(e); }
});
app.use("/api/exercises", requireAuth, exercisesRouter);
app.use("/api/workout-plans", requireAuth, workoutPlansRouter);
app.use("/api/groups", requireAuth, groupsRouter);
app.use("/api/sessions", requireAuth, sessionsRouter);
app.use("/api/workout-logs", requireAuth, workoutLogsRouter);
app.use("/api/metrics", requireAuth, metricsRouter);

app.use(errorHandler);

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`),
);

export default app;
