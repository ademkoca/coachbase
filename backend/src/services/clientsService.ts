import { eq, and, max } from 'drizzle-orm'
import { db } from '../db/client.js'
import { clients, sessions, sessionClients, trainers } from '../db/schema.js'

export async function listClients(trainerId: string) {
  return db.select().from(clients).where(eq(clients.trainerId, trainerId))
}

export async function getClient(trainerId: string, clientId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)))
  return client ?? null
}

export async function createClient(
  trainerId: string,
  data: { name: string; email?: string; phone?: string; notes?: string; gender?: string; goal?: string; injuryNotes?: string; avatarUrl?: string }
) {
  const [client] = await db
    .insert(clients)
    .values({ trainerId, ...data })
    .returning()
  return client
}

export async function updateClient(
  trainerId: string,
  clientId: string,
  data: Partial<{ name: string; email: string; phone: string; notes: string; gender: string; goal: string; injuryNotes: string; avatarUrl: string }>
) {
  const [client] = await db
    .update(clients)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)))
    .returning()
  return client ?? null
}

export async function listStaleClients(trainerId: string) {
  const [trainer] = await db
    .select({ thresholdDays: trainers.staleClientThresholdDays })
    .from(trainers)
    .where(eq(trainers.id, trainerId))
  const thresholdDays = trainer?.thresholdDays ?? 14

  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      lastSessionAt: max(sessions.scheduledAt),
    })
    .from(clients)
    .leftJoin(sessionClients, eq(sessionClients.clientId, clients.id))
    .leftJoin(sessions, eq(sessions.id, sessionClients.sessionId))
    .where(eq(clients.trainerId, trainerId))
    .groupBy(clients.id, clients.name)

  const now = Date.now()
  const cutoffMs = now - thresholdDays * 24 * 60 * 60 * 1000

  return rows
    .filter((r) => r.lastSessionAt == null || new Date(r.lastSessionAt).getTime() < cutoffMs)
    .map((r) => ({
      id: r.id,
      name: r.name,
      lastSessionAt: r.lastSessionAt ? new Date(r.lastSessionAt).toISOString() : null,
      daysSinceLastSession: r.lastSessionAt
        ? Math.floor((now - new Date(r.lastSessionAt).getTime()) / 86400000)
        : null,
    }))
    .sort((a, b) => {
      // Never-active first, then oldest last-session first
      if (a.daysSinceLastSession === null) return -1
      if (b.daysSinceLastSession === null) return 1
      return b.daysSinceLastSession - a.daysSinceLastSession
    })
}

export async function deleteClient(trainerId: string, clientId: string) {
  const [client] = await db
    .delete(clients)
    .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)))
    .returning()
  return client ?? null
}
