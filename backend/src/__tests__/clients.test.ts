import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import app from '../index.js'
import { db, pool } from '../db/client.js'
import { trainers, clients } from '../db/schema.js'

// Mock Firebase Admin so tests don't need real credentials
vi.mock('../firebase-admin.js', () => ({
  adminAuth: {
    verifyIdToken: vi.fn(async (token: string) => {
      if (token === 'trainer-a-token') return { uid: 'trainer-a' }
      if (token === 'trainer-b-token') return { uid: 'trainer-b' }
      throw new Error('Invalid token')
    }),
  },
}))

const authA = { Authorization: 'Bearer trainer-a-token' }
const authB = { Authorization: 'Bearer trainer-b-token' }

beforeAll(async () => {
  await db
    .insert(trainers)
    .values([
      { id: 'trainer-a', email: 'a@test.com' },
      { id: 'trainer-b', email: 'b@test.com' },
    ])
    .onConflictDoNothing()
})

afterAll(async () => {
  await db.delete(clients).execute()
  await db.delete(trainers).execute()
  await pool.end()
})

describe('GET /api/clients', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/clients')
    expect(res.status).toBe(401)
  })

  it('returns empty array for new trainer', async () => {
    const res = await request(app).get('/api/clients').set(authA)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

describe('POST /api/clients', () => {
  it('creates a client for trainer A', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set(authA)
      .send({ name: 'Alice', email: 'alice@test.com' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Alice')
    expect(res.body.trainerId).toBe('trainer-a')
  })
})

describe('Trainer isolation', () => {
  it("trainer B cannot see trainer A's clients", async () => {
    const resA = await request(app).get('/api/clients').set(authA)
    const resB = await request(app).get('/api/clients').set(authB)
    expect(resA.body.length).toBeGreaterThan(0)
    expect(resB.body).toEqual([])
  })

  it("trainer B cannot fetch trainer A's client by ID", async () => {
    const resA = await request(app).get('/api/clients').set(authA)
    const clientId = resA.body[0].id
    const res = await request(app).get(`/api/clients/${clientId}`).set(authB)
    expect(res.status).toBe(404)
  })
})
