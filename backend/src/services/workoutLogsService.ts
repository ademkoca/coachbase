import { eq, and, inArray, desc } from 'drizzle-orm'
import { db } from '../db/client.js'
import {
  sessions,
  sessionClients,
  clients,
  exercises,
  planExercises,
  workoutLogs,
  workoutLogExercises,
  workoutLogSets,
  personalRecords,
} from '../db/schema.js'

async function ownsSession(trainerId: string, sessionId: string) {
  const [s] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.trainerId, trainerId)))
  return s ?? null
}

async function ownsLog(trainerId: string, logId: string) {
  const [log] = await db
    .select()
    .from(workoutLogs)
    .where(and(eq(workoutLogs.id, logId), eq(workoutLogs.trainerId, trainerId)))
  return log ?? null
}

export async function startSession(trainerId: string, sessionId: string) {
  const session = await ownsSession(trainerId, sessionId)
  if (!session) return null

  const participants = await db
    .select({ clientId: sessionClients.clientId })
    .from(sessionClients)
    .where(eq(sessionClients.sessionId, sessionId))

  if (participants.length === 0) return []

  // Find which clients already have a log for this session (idempotency)
  const existing = await db
    .select()
    .from(workoutLogs)
    .where(eq(workoutLogs.sessionId, sessionId))
  const existingClientIds = new Set(existing.map((l) => l.clientId))

  const toCreate = participants.filter((p) => !existingClientIds.has(p.clientId))

  if (toCreate.length > 0) {
    const inserted = await db
      .insert(workoutLogs)
      .values(
        toCreate.map((p) => ({
          sessionId,
          clientId: p.clientId,
          trainerId,
          startedAt: new Date(),
        }))
      )
      .returning()

    // Prefill exercises from the workout plan, if any
    if (session.workoutPlanId) {
      const planEx = await db
        .select()
        .from(planExercises)
        .where(eq(planExercises.planId, session.workoutPlanId))
        .orderBy(planExercises.position)

      if (planEx.length > 0) {
        await db.insert(workoutLogExercises).values(
          inserted.flatMap((log) =>
            planEx.map((pe, i) => ({
              logId: log.id,
              exerciseId: pe.exerciseId,
              position: i,
            }))
          )
        )
      }
    }
  }

  return listLogsForSession(trainerId, sessionId)
}

export async function listLogsForSession(trainerId: string, sessionId: string) {
  const session = await ownsSession(trainerId, sessionId)
  if (!session) return null

  const logs = await db
    .select()
    .from(workoutLogs)
    .where(eq(workoutLogs.sessionId, sessionId))

  if (logs.length === 0) return []

  const clientRows = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(inArray(clients.id, logs.map((l) => l.clientId)))

  const logIds = logs.map((l) => l.id)
  const logExs = await db
    .select({
      id: workoutLogExercises.id,
      logId: workoutLogExercises.logId,
      exerciseId: workoutLogExercises.exerciseId,
      position: workoutLogExercises.position,
      exerciseName: exercises.name,
    })
    .from(workoutLogExercises)
    .innerJoin(exercises, eq(workoutLogExercises.exerciseId, exercises.id))
    .where(inArray(workoutLogExercises.logId, logIds))
    .orderBy(workoutLogExercises.position)

  const logExIds = logExs.map((le) => le.id)
  const sets =
    logExIds.length > 0
      ? await db
          .select()
          .from(workoutLogSets)
          .where(inArray(workoutLogSets.logExerciseId, logExIds))
      : []

  return logs.map((log) => ({
    ...log,
    clientName: clientRows.find((c) => c.id === log.clientId)?.name ?? '',
    exercises: logExs
      .filter((le) => le.logId === log.id)
      .map((le) => ({
        id: le.id,
        exerciseId: le.exerciseId,
        exerciseName: le.exerciseName,
        position: le.position,
        sets: sets.filter((s) => s.logExerciseId === le.id).sort((a, b) => a.setNumber - b.setNumber),
      })),
  }))
}

export async function getLog(trainerId: string, logId: string) {
  const log = await ownsLog(trainerId, logId)
  if (!log) return null

  const [client] = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.id, log.clientId))

  const logExs = await db
    .select({
      id: workoutLogExercises.id,
      exerciseId: workoutLogExercises.exerciseId,
      position: workoutLogExercises.position,
      exerciseName: exercises.name,
    })
    .from(workoutLogExercises)
    .innerJoin(exercises, eq(workoutLogExercises.exerciseId, exercises.id))
    .where(eq(workoutLogExercises.logId, logId))
    .orderBy(workoutLogExercises.position)

  const setsRows =
    logExs.length > 0
      ? await db
          .select()
          .from(workoutLogSets)
          .where(inArray(workoutLogSets.logExerciseId, logExs.map((le) => le.id)))
      : []

  return {
    ...log,
    clientName: client?.name ?? '',
    exercises: logExs.map((le) => ({
      ...le,
      sets: setsRows.filter((s) => s.logExerciseId === le.id).sort((a, b) => a.setNumber - b.setNumber),
    })),
  }
}

export async function listLogsForClient(trainerId: string, clientId: string) {
  const logs = await db
    .select({
      id: workoutLogs.id,
      sessionId: workoutLogs.sessionId,
      startedAt: workoutLogs.startedAt,
      endedAt: workoutLogs.endedAt,
      durationMinutes: workoutLogs.durationMinutes,
      sessionTitle: sessions.title,
    })
    .from(workoutLogs)
    .innerJoin(sessions, eq(workoutLogs.sessionId, sessions.id))
    .where(and(eq(workoutLogs.clientId, clientId), eq(workoutLogs.trainerId, trainerId)))
    .orderBy(desc(workoutLogs.startedAt))

  if (logs.length === 0) return []

  // Count exercises per log
  const exCounts = await db
    .select({ logId: workoutLogExercises.logId, exerciseId: workoutLogExercises.exerciseId })
    .from(workoutLogExercises)
    .where(inArray(workoutLogExercises.logId, logs.map((l) => l.id)))

  return logs.map((l) => ({
    ...l,
    exerciseCount: exCounts.filter((e) => e.logId === l.id).length,
  }))
}

export async function listPRsForClient(trainerId: string, clientId: string) {
  return db
    .select({
      id: personalRecords.id,
      exerciseId: personalRecords.exerciseId,
      exerciseName: exercises.name,
      weightKg: personalRecords.weightKg,
      reps: personalRecords.reps,
      achievedAt: personalRecords.achievedAt,
    })
    .from(personalRecords)
    .innerJoin(exercises, eq(personalRecords.exerciseId, exercises.id))
    .where(
      and(eq(personalRecords.clientId, clientId), eq(personalRecords.trainerId, trainerId))
    )
    .orderBy(desc(personalRecords.achievedAt))
}

export async function updateLogNotes(
  trainerId: string,
  logId: string,
  notes: string | null
) {
  const log = await ownsLog(trainerId, logId)
  if (!log) return null
  const [updated] = await db
    .update(workoutLogs)
    .set({ notes })
    .where(eq(workoutLogs.id, logId))
    .returning()
  return updated
}

export async function addExerciseToLog(
  trainerId: string,
  logId: string,
  exerciseId: string
) {
  const log = await ownsLog(trainerId, logId)
  if (!log) return null
  const existing = await db
    .select()
    .from(workoutLogExercises)
    .where(eq(workoutLogExercises.logId, logId))
  const [le] = await db
    .insert(workoutLogExercises)
    .values({ logId, exerciseId, position: existing.length })
    .returning()
  return le
}

export async function removeExerciseFromLog(
  trainerId: string,
  logId: string,
  logExerciseId: string
) {
  const log = await ownsLog(trainerId, logId)
  if (!log) return null
  const [removed] = await db
    .delete(workoutLogExercises)
    .where(
      and(eq(workoutLogExercises.id, logExerciseId), eq(workoutLogExercises.logId, logId))
    )
    .returning()
  return removed ?? null
}

export async function upsertSet(
  trainerId: string,
  logId: string,
  logExerciseId: string,
  setNumber: number,
  data: { reps?: number | null; weightKg?: number | null }
) {
  const log = await ownsLog(trainerId, logId)
  if (!log) return null

  // Verify the logExercise belongs to this log
  const [le] = await db
    .select()
    .from(workoutLogExercises)
    .where(
      and(eq(workoutLogExercises.id, logExerciseId), eq(workoutLogExercises.logId, logId))
    )
  if (!le) return null

  const weightStr = data.weightKg == null ? null : String(data.weightKg)

  const [existing] = await db
    .select()
    .from(workoutLogSets)
    .where(
      and(
        eq(workoutLogSets.logExerciseId, logExerciseId),
        eq(workoutLogSets.setNumber, setNumber)
      )
    )

  if (existing) {
    const [updated] = await db
      .update(workoutLogSets)
      .set({ reps: data.reps ?? null, weightKg: weightStr })
      .where(eq(workoutLogSets.id, existing.id))
      .returning()
    return updated
  }
  const [inserted] = await db
    .insert(workoutLogSets)
    .values({
      logExerciseId,
      setNumber,
      reps: data.reps ?? null,
      weightKg: weightStr,
    })
    .returning()
  return inserted
}

export async function endSession(trainerId: string, sessionId: string) {
  const session = await ownsSession(trainerId, sessionId)
  if (!session) return null

  const logs = await db
    .select()
    .from(workoutLogs)
    .where(and(eq(workoutLogs.sessionId, sessionId), eq(workoutLogs.trainerId, trainerId)))

  const now = new Date()

  for (const log of logs) {
    if (log.endedAt) continue // already ended; skip

    const durationMs = now.getTime() - new Date(log.startedAt).getTime()
    const durationMinutes = Math.max(1, Math.round(durationMs / 60000))

    await db
      .update(workoutLogs)
      .set({ endedAt: now, durationMinutes })
      .where(eq(workoutLogs.id, log.id))

    // Evaluate PRs for this log
    const logExs = await db
      .select()
      .from(workoutLogExercises)
      .where(eq(workoutLogExercises.logId, log.id))

    if (logExs.length === 0) continue

    const setsByExercise = await db
      .select()
      .from(workoutLogSets)
      .where(inArray(workoutLogSets.logExerciseId, logExs.map((le) => le.id)))

    for (const le of logExs) {
      const exSets = setsByExercise.filter(
        (s) => s.logExerciseId === le.id && s.weightKg != null
      )
      if (exSets.length === 0) continue

      // Find heaviest set in this log for this exercise
      const heaviest = exSets.reduce((best, cur) => {
        const w = Number(cur.weightKg)
        const bw = Number(best.weightKg)
        return w > bw ? cur : best
      })
      const heaviestWeight = Number(heaviest.weightKg)

      // Look up existing PR
      const [currentPR] = await db
        .select()
        .from(personalRecords)
        .where(
          and(
            eq(personalRecords.clientId, log.clientId),
            eq(personalRecords.exerciseId, le.exerciseId)
          )
        )

      const isPR = !currentPR || heaviestWeight > Number(currentPR.weightKg)

      if (isPR) {
        await db
          .update(workoutLogSets)
          .set({ wasPersonalRecord: true })
          .where(eq(workoutLogSets.id, heaviest.id))

        if (currentPR) {
          await db
            .update(personalRecords)
            .set({
              weightKg: String(heaviestWeight),
              reps: heaviest.reps ?? 1,
              achievedAt: now,
              logSetId: heaviest.id,
            })
            .where(eq(personalRecords.id, currentPR.id))
        } else {
          await db.insert(personalRecords).values({
            clientId: log.clientId,
            exerciseId: le.exerciseId,
            trainerId,
            weightKg: String(heaviestWeight),
            reps: heaviest.reps ?? 1,
            achievedAt: now,
            logSetId: heaviest.id,
          })
        }
      }
    }
  }

  // Mark session as completed
  await db
    .update(sessions)
    .set({ status: 'completed', updatedAt: now })
    .where(eq(sessions.id, sessionId))

  return listLogsForSession(trainerId, sessionId)
}
