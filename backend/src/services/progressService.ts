import { eq, and } from 'drizzle-orm'
import { db } from '../db/client.js'
import { progressEntries, progressPhotos, clients } from '../db/schema.js'

async function verifyClientOwnership(trainerId: string, clientId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)))
  return client ?? null
}

export async function listProgress(trainerId: string, clientId: string) {
  const client = await verifyClientOwnership(trainerId, clientId)
  if (!client) return null
  const entries = await db
    .select()
    .from(progressEntries)
    .where(and(eq(progressEntries.clientId, clientId), eq(progressEntries.trainerId, trainerId)))
    .orderBy(progressEntries.measuredAt)
  const entryIds = entries.map((e) => e.id)
  if (entryIds.length === 0) return entries.map((e) => ({ ...e, photos: [] }))
  const allPhotos = await db
    .select()
    .from(progressPhotos)
    .where(
      entryIds.length === 1
        ? eq(progressPhotos.entryId, entryIds[0])
        : eq(progressPhotos.entryId, progressPhotos.entryId)
    )
  // group photos by entryId
  const photoMap = new Map<string, typeof allPhotos>()
  for (const p of allPhotos) {
    if (!photoMap.has(p.entryId)) photoMap.set(p.entryId, [])
    photoMap.get(p.entryId)!.push(p)
  }
  return entries.map((e) => ({ ...e, photos: photoMap.get(e.id) ?? [] }))
}

export async function createProgressEntry(
  trainerId: string,
  clientId: string,
  data: {
    measuredAt: string
    weightKg?: string
    bicepCm?: string
    shouldersCm?: string
    chestCm?: string
    waistCm?: string
    buttCm?: string
    thighCm?: string
    notes?: string
  }
) {
  const client = await verifyClientOwnership(trainerId, clientId)
  if (!client) return null
  const [entry] = await db
    .insert(progressEntries)
    .values({
      clientId,
      trainerId,
      ...data,
      measuredAt: new Date(data.measuredAt),
    })
    .returning()
  return entry
}

export async function getProgressEntry(trainerId: string, clientId: string, entryId: string) {
  const [entry] = await db
    .select()
    .from(progressEntries)
    .where(
      and(
        eq(progressEntries.id, entryId),
        eq(progressEntries.clientId, clientId),
        eq(progressEntries.trainerId, trainerId)
      )
    )
  if (!entry) return null
  const photos = await db
    .select()
    .from(progressPhotos)
    .where(eq(progressPhotos.entryId, entryId))
  return { ...entry, photos }
}

export async function updateProgressEntry(
  trainerId: string,
  clientId: string,
  entryId: string,
  data: Partial<{
    measuredAt: string
    weightKg: string
    bicepCm: string
    shouldersCm: string
    chestCm: string
    waistCm: string
    buttCm: string
    thighCm: string
    notes: string
  }>
) {
  const updateData: Record<string, unknown> = { ...data }
  if (data.measuredAt) updateData.measuredAt = new Date(data.measuredAt)
  const [entry] = await db
    .update(progressEntries)
    .set(updateData)
    .where(
      and(
        eq(progressEntries.id, entryId),
        eq(progressEntries.clientId, clientId),
        eq(progressEntries.trainerId, trainerId)
      )
    )
    .returning()
  return entry ?? null
}

export async function deleteProgressEntry(
  trainerId: string,
  clientId: string,
  entryId: string
) {
  const [entry] = await db
    .delete(progressEntries)
    .where(
      and(
        eq(progressEntries.id, entryId),
        eq(progressEntries.clientId, clientId),
        eq(progressEntries.trainerId, trainerId)
      )
    )
    .returning()
  return entry ?? null
}

export async function addProgressPhoto(
  trainerId: string,
  clientId: string,
  entryId: string,
  view: string,
  storageUrl: string
) {
  const entry = await getProgressEntry(trainerId, clientId, entryId)
  if (!entry) return null
  // max 2 photos per entry
  if (entry.photos.length >= 2) return null
  const [photo] = await db
    .insert(progressPhotos)
    .values({ entryId, view, storageUrl })
    .returning()
  return photo
}

export async function deleteProgressPhoto(
  trainerId: string,
  clientId: string,
  entryId: string,
  photoId: string
) {
  const entry = await getProgressEntry(trainerId, clientId, entryId)
  if (!entry) return null
  const [photo] = await db
    .delete(progressPhotos)
    .where(and(eq(progressPhotos.id, photoId), eq(progressPhotos.entryId, entryId)))
    .returning()
  return photo ?? null
}
