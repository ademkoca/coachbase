import { eq, and, gte, lte, inArray, SQL } from 'drizzle-orm'
import { db } from '../db/client.js'
import { sessions, sessionClients, clients, groups } from '../db/schema.js'

export async function listSessions(
  trainerId: string,
  filters: {
    from?: string
    to?: string
    clientId?: string
    groupId?: string
    status?: string
  }
) {
  const conditions: SQL[] = [eq(sessions.trainerId, trainerId)]
  if (filters.from) conditions.push(gte(sessions.scheduledAt, new Date(filters.from)))
  if (filters.to) conditions.push(lte(sessions.scheduledAt, new Date(filters.to)))
  if (filters.groupId) conditions.push(eq(sessions.groupId, filters.groupId))
  if (filters.status) conditions.push(eq(sessions.status, filters.status))

  let rows = await db
    .select()
    .from(sessions)
    .where(and(...conditions))
    .orderBy(sessions.scheduledAt)

  if (filters.clientId) {
    const clientSessionIds = await db
      .select({ sessionId: sessionClients.sessionId })
      .from(sessionClients)
      .where(eq(sessionClients.clientId, filters.clientId))
    const ids = new Set(clientSessionIds.map((r) => r.sessionId))
    rows = rows.filter((s) => ids.has(s.id))
  }

  if (rows.length === 0) return []

  // Bulk-fetch client names for all sessions (2 extra queries, no N+1)
  const sessionIds = rows.map((s) => s.id)
  const participants = await db
    .select({ sessionId: sessionClients.sessionId, name: clients.name })
    .from(sessionClients)
    .innerJoin(clients, eq(sessionClients.clientId, clients.id))
    .where(inArray(sessionClients.sessionId, sessionIds))

  const groupIds = rows.map((s) => s.groupId).filter(Boolean) as string[]
  const groupRows =
    groupIds.length > 0
      ? await db
          .select({ id: groups.id, name: groups.name })
          .from(groups)
          .where(inArray(groups.id, groupIds))
      : []

  return rows.map((s) => ({
    ...s,
    clientNames: participants.filter((p) => p.sessionId === s.id).map((p) => p.name),
    groupName: groupRows.find((g) => g.id === s.groupId)?.name ?? null,
  }))
}

export async function getSession(trainerId: string, sessionId: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.trainerId, trainerId)))
  if (!session) return null
  const participants = await db
    .select({ client: clients })
    .from(sessionClients)
    .innerJoin(clients, eq(sessionClients.clientId, clients.id))
    .where(eq(sessionClients.sessionId, sessionId))
  let group = null
  if (session.groupId) {
    const [g] = await db.select().from(groups).where(eq(groups.id, session.groupId))
    group = g ?? null
  }
  return { ...session, clients: participants.map((p) => p.client), group }
}

export async function createSession(
  trainerId: string,
  data: {
    title: string
    scheduledAt: string
    durationMinutes?: number
    workoutPlanId?: string
    groupId?: string
    location?: string
    notes?: string
    clientIds?: string[]
  }
) {
  const { clientIds, ...rest } = data
  const [session] = await db
    .insert(sessions)
    .values({
      trainerId,
      ...rest,
      scheduledAt: new Date(data.scheduledAt),
    })
    .returning()
  if (clientIds && clientIds.length > 0) {
    await db
      .insert(sessionClients)
      .values(clientIds.map((clientId) => ({ sessionId: session.id, clientId })))
      .onConflictDoNothing()
  }
  return session
}

export async function updateSession(
  trainerId: string,
  sessionId: string,
  data: Partial<{
    title: string
    scheduledAt: string
    durationMinutes: number
    workoutPlanId: string
    groupId: string
    location: string
    notes: string
    status: string
  }>
) {
  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() }
  if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt)
  const [session] = await db
    .update(sessions)
    .set(updateData)
    .where(and(eq(sessions.id, sessionId), eq(sessions.trainerId, trainerId)))
    .returning()
  return session ?? null
}

export async function createRecurringSessions(
  trainerId: string,
  data: {
    title: string
    startDate: string
    endDate: string
    time: string
    daysOfWeek: number[]
    durationMinutes?: number
    workoutPlanId?: string
    groupId?: string
    clientIds?: string[]
    location?: string
    notes?: string
  }
) {
  const { clientIds, startDate, endDate, time, daysOfWeek, ...rest } = data
  const [hours, minutes] = time.split(':').map(Number)

  const occurrences: Date[] = []
  const cursor = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T23:59:59`)

  while (cursor <= end) {
    if (daysOfWeek.includes(cursor.getDay())) {
      const d = new Date(cursor)
      d.setHours(hours, minutes, 0, 0)
      occurrences.push(d)
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  if (occurrences.length === 0) return []

  const rows = await db
    .insert(sessions)
    .values(
      occurrences.map((scheduledAt) => ({
        trainerId,
        ...rest,
        scheduledAt,
      }))
    )
    .returning()

  if (clientIds && clientIds.length > 0) {
    await db
      .insert(sessionClients)
      .values(
        rows.flatMap((s) => clientIds.map((clientId) => ({ sessionId: s.id, clientId })))
      )
      .onConflictDoNothing()
  }

  return rows
}

export async function deleteSession(trainerId: string, sessionId: string) {
  const [session] = await db
    .delete(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.trainerId, trainerId)))
    .returning()
  return session ?? null
}

export async function addSessionClient(
  trainerId: string,
  sessionId: string,
  clientId: string
) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.trainerId, trainerId)))
  if (!session) return null
  await db
    .insert(sessionClients)
    .values({ sessionId, clientId })
    .onConflictDoNothing()
  return { sessionId, clientId }
}

export async function removeSessionClient(
  trainerId: string,
  sessionId: string,
  clientId: string
) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.trainerId, trainerId)))
  if (!session) return null
  const [sc] = await db
    .delete(sessionClients)
    .where(and(eq(sessionClients.sessionId, sessionId), eq(sessionClients.clientId, clientId)))
    .returning()
  return sc ?? null
}
