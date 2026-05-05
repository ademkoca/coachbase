import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../db/client.js'
import { groups, groupMembers, clients } from '../db/schema.js'

export async function listGroups(trainerId: string) {
  return db.select().from(groups).where(eq(groups.trainerId, trainerId))
}

export async function getGroup(trainerId: string, groupId: string) {
  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.trainerId, trainerId)))
  if (!group) return null
  const members = await db
    .select({ client: clients })
    .from(groupMembers)
    .innerJoin(clients, eq(groupMembers.clientId, clients.id))
    .where(eq(groupMembers.groupId, groupId))
  return { ...group, members: members.map((m) => m.client) }
}

export async function createGroup(
  trainerId: string,
  data: { name: string; description?: string }
) {
  const [group] = await db.insert(groups).values({ trainerId, ...data }).returning()
  return group
}

export async function updateGroup(
  trainerId: string,
  groupId: string,
  data: Partial<{ name: string; description: string }>
) {
  const [group] = await db
    .update(groups)
    .set(data)
    .where(and(eq(groups.id, groupId), eq(groups.trainerId, trainerId)))
    .returning()
  return group ?? null
}

export async function deleteGroup(trainerId: string, groupId: string) {
  const [group] = await db
    .delete(groups)
    .where(and(eq(groups.id, groupId), eq(groups.trainerId, trainerId)))
    .returning()
  return group ?? null
}

export async function addGroupMembers(
  trainerId: string,
  groupId: string,
  clientIds: string[]
) {
  // verify group belongs to trainer
  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.trainerId, trainerId)))
  if (!group) return null
  // verify all clients belong to trainer
  const ownedClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(inArray(clients.id, clientIds), eq(clients.trainerId, trainerId)))
  const ownedIds = ownedClients.map((c) => c.id)
  if (ownedIds.length === 0) return []
  await db
    .insert(groupMembers)
    .values(ownedIds.map((clientId) => ({ groupId, clientId })))
    .onConflictDoNothing()
  return ownedIds
}

export async function removeGroupMember(
  trainerId: string,
  groupId: string,
  clientId: string
) {
  const [group] = await db
    .select()
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.trainerId, trainerId)))
  if (!group) return null
  const [member] = await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.clientId, clientId)))
    .returning()
  return member ?? null
}
