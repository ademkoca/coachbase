import { Router } from 'express'
import * as svc from '../services/workoutLogsService.js'

const router = Router()

router.post('/sessions/:sessionId/start', async (req, res, next) => {
  try {
    const result = await svc.startSession(req.trainerId, req.params.sessionId)
    if (result === null) return res.status(404).json({ error: 'Not found' })
    res.status(201).json(result)
  } catch (e) { next(e) }
})

router.post('/sessions/:sessionId/end', async (req, res, next) => {
  try {
    const result = await svc.endSession(req.trainerId, req.params.sessionId)
    if (result === null) return res.status(404).json({ error: 'Not found' })
    res.json(result)
  } catch (e) { next(e) }
})

router.get('/sessions/:sessionId', async (req, res, next) => {
  try {
    const result = await svc.listLogsForSession(req.trainerId, req.params.sessionId)
    if (result === null) return res.status(404).json({ error: 'Not found' })
    res.json(result)
  } catch (e) { next(e) }
})

router.get('/clients/:clientId', async (req, res, next) => {
  try {
    res.json(await svc.listLogsForClient(req.trainerId, req.params.clientId))
  } catch (e) { next(e) }
})

router.get('/clients/:clientId/personal-records', async (req, res, next) => {
  try {
    res.json(await svc.listPRsForClient(req.trainerId, req.params.clientId))
  } catch (e) { next(e) }
})

router.get('/:logId', async (req, res, next) => {
  try {
    const log = await svc.getLog(req.trainerId, req.params.logId)
    if (!log) return res.status(404).json({ error: 'Not found' })
    res.json(log)
  } catch (e) { next(e) }
})

router.patch('/:logId', async (req, res, next) => {
  try {
    const { notes } = req.body as { notes?: string | null }
    const result = await svc.updateLogNotes(
      req.trainerId,
      req.params.logId,
      notes ?? null
    )
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.json(result)
  } catch (e) { next(e) }
})

router.post('/:logId/exercises', async (req, res, next) => {
  try {
    const { exerciseId } = req.body as { exerciseId: string }
    const result = await svc.addExerciseToLog(req.trainerId, req.params.logId, exerciseId)
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.status(201).json(result)
  } catch (e) { next(e) }
})

router.delete('/:logId/exercises/:logExerciseId', async (req, res, next) => {
  try {
    const result = await svc.removeExerciseFromLog(
      req.trainerId,
      req.params.logId,
      req.params.logExerciseId
    )
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

router.put('/:logId/exercises/:logExerciseId/sets/:setNumber', async (req, res, next) => {
  try {
    const setNumber = Number(req.params.setNumber)
    if (!Number.isInteger(setNumber) || setNumber < 1 || setNumber > 5) {
      return res.status(400).json({ error: 'setNumber must be 1-5' })
    }
    const { reps, weightKg } = req.body as {
      reps?: number | null
      weightKg?: number | null
    }
    const result = await svc.upsertSet(
      req.trainerId,
      req.params.logId,
      req.params.logExerciseId,
      setNumber,
      { reps, weightKg }
    )
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.json(result)
  } catch (e) { next(e) }
})

export default router
