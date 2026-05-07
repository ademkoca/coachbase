import { Router } from 'express'
import { getMetrics } from '../services/metricsService.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string }
    if (!from || !to) return res.status(400).json({ error: 'from and to query params are required' })
    res.json(await getMetrics(req.trainerId, from, to))
  } catch (e) {
    next(e)
  }
})

export default router
