import { eq, and, or, isNull, SQL } from 'drizzle-orm'
import { db } from '../db/client.js'
import { exercises } from '../db/schema.js'

export async function listExercises(
  trainerId: string,
  filters: { muscleGroup?: string; category?: string }
) {
  const conditions: SQL[] = [or(isNull(exercises.trainerId), eq(exercises.trainerId, trainerId))!]
  if (filters.muscleGroup) conditions.push(eq(exercises.muscleGroup, filters.muscleGroup))
  if (filters.category) conditions.push(eq(exercises.category, filters.category))
  return db
    .select()
    .from(exercises)
    .where(conditions.length === 1 ? conditions[0] : and(...conditions))
}

export async function createExercise(
  trainerId: string,
  data: { name: string; muscleGroup: string; category: string; description?: string }
) {
  const [exercise] = await db
    .insert(exercises)
    .values({ trainerId, ...data })
    .returning()
  return exercise
}

export async function updateExercise(
  trainerId: string,
  exerciseId: string,
  data: Partial<{ name: string; muscleGroup: string; category: string; description: string }>
) {
  const [exercise] = await db
    .update(exercises)
    .set(data)
    .where(and(eq(exercises.id, exerciseId), eq(exercises.trainerId, trainerId)))
    .returning()
  return exercise ?? null
}

export async function deleteExercise(trainerId: string, exerciseId: string) {
  const [exercise] = await db
    .delete(exercises)
    .where(and(eq(exercises.id, exerciseId), eq(exercises.trainerId, trainerId)))
    .returning()
  return exercise ?? null
}
