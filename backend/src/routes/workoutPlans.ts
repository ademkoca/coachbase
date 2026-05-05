import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { trainers } from '../db/schema.js'
import * as svc from '../services/workoutPlansService.js'
import * as clientSvc from '../services/clientsService.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    res.json(await svc.listPlans(req.trainerId))
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const plan = await svc.createPlan(req.trainerId, req.body)
    res.status(201).json(plan)
  } catch (e) { next(e) }
})

router.get('/:id/export', async (req, res, next) => {
  try {
    const [trainer] = await db.select().from(trainers).where(eq(trainers.id, req.trainerId))
    const trainerName = trainer?.displayName ?? undefined
    const trainerEmail = trainer?.email ?? undefined
    const trainerPhone = trainer?.phone ?? undefined

    const clientId = req.query.clientId as string | undefined
    let client: { name: string; email?: string | null; phone?: string | null } | undefined
    if (clientId) {
      const found = await clientSvc.getClient(req.trainerId, clientId)
      if (found) client = { name: found.name, email: found.email, phone: found.phone }
    }

    const result = await svc.exportPlanAsPdf(req.trainerId, req.params.id, res, { trainerName, trainerEmail, trainerPhone, client })
    if (!result) res.status(404).json({ error: 'Not found' })
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const plan = await svc.getPlan(req.trainerId, req.params.id)
    if (!plan) return res.status(404).json({ error: 'Not found' })
    res.json(plan)
  } catch (e) { next(e) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const plan = await svc.updatePlan(req.trainerId, req.params.id, req.body)
    if (!plan) return res.status(404).json({ error: 'Not found' })
    res.json(plan)
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const plan = await svc.deletePlan(req.trainerId, req.params.id)
    if (!plan) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

router.put('/:id/exercises', async (req, res, next) => {
  try {
    const result = await svc.replacePlanExercises(req.trainerId, req.params.id, req.body)
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.json(result)
  } catch (e) { next(e) }
})

router.post('/:id/exercises', async (req, res, next) => {
  try {
    const pe = await svc.addPlanExercise(req.trainerId, req.params.id, req.body)
    if (!pe) return res.status(404).json({ error: 'Not found' })
    res.status(201).json(pe)
  } catch (e) { next(e) }
})

router.delete('/:id/exercises/:peId', async (req, res, next) => {
  try {
    const pe = await svc.removePlanExercise(req.trainerId, req.params.id, req.params.peId)
    if (!pe) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

export default router
