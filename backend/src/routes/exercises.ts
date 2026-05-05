import { Router } from 'express'
import * as svc from '../services/exercisesService.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { muscleGroup, category } = req.query as Record<string, string>
    res.json(await svc.listExercises(req.trainerId, { muscleGroup, category }))
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const exercise = await svc.createExercise(req.trainerId, req.body)
    res.status(201).json(exercise)
  } catch (e) { next(e) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const exercise = await svc.updateExercise(req.trainerId, req.params.id, req.body)
    if (!exercise) return res.status(404).json({ error: 'Not found' })
    res.json(exercise)
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const exercise = await svc.deleteExercise(req.trainerId, req.params.id)
    if (!exercise) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

export default router
