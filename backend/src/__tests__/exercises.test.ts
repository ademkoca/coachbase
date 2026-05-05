import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import { db, pool } from '../db/client.js'
import { trainers, exercises } from '../db/schema.js'

vi.mock('../firebase-admin.js', () => ({
  adminAuth: {
    verifyIdToken: vi.fn(async (token: string) => {
      if (token === 'trainer-a-token') return { uid: 'trainer-a' }
      throw new Error('Invalid token')
    }),
  },
}))

const authA = { Authorization: 'Bearer trainer-a-token' }

beforeAll(async () => {
  await db.insert(trainers).values({ id: 'trainer-a', email: 'a@test.com' }).onConflictDoNothing()
  // Seed one global exercise
  await db
    .insert(exercises)
    .values({ name: 'Global Push Up', muscleGroup: 'chest', category: 'strength', trainerId: null })
    .onConflictDoNothing()
})

afterAll(async () => {
  await db.delete(exercises).execute()
  await db.delete(trainers).execute()
  await pool.end()
})

describe('GET /api/exercises', () => {
  it('returns global exercises', async () => {
    const res = await request(app).get('/api/exercises').set(authA)
    expect(res.status).toBe(200)
    expect(res.body.some((e: { name: string }) => e.name === 'Global Push Up')).toBe(true)
  })
})

describe('POST /api/exercises', () => {
  it('creates a custom exercise', async () => {
    const res = await request(app)
      .post('/api/exercises')
      .set(authA)
      .send({ name: 'My Custom Exercise', muscleGroup: 'arms', category: 'strength' })
    expect(res.status).toBe(201)
    expect(res.body.trainerId).toBe('trainer-a')
  })
})

describe('DELETE /api/exercises/:id', () => {
  it('cannot delete a global exercise', async () => {
    const list = await request(app).get('/api/exercises').set(authA)
    const global = list.body.find((e: { name: string; trainerId: string | null }) => !e.trainerId)
    if (!global) return
    const res = await request(app).delete(`/api/exercises/${global.id}`).set(authA)
    expect(res.status).toBe(404) // trainerId mismatch → service returns null → 404
  })
})
