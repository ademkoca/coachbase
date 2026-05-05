import { Router } from 'express'
import * as svc from '../services/sessionsService.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { from, to, clientId, groupId, status } = req.query as Record<string, string>
    res.json(await svc.listSessions(req.trainerId, { from, to, clientId, groupId, status }))
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const session = await svc.createSession(req.trainerId, req.body)
    res.status(201).json(session)
  } catch (e) { next(e) }
})

router.post('/recurring', async (req, res, next) => {
  try {
    const sessions = await svc.createRecurringSessions(req.trainerId, req.body)
    res.status(201).json(sessions)
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const session = await svc.getSession(req.trainerId, req.params.id)
    if (!session) return res.status(404).json({ error: 'Not found' })
    res.json(session)
  } catch (e) { next(e) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const session = await svc.updateSession(req.trainerId, req.params.id, req.body)
    if (!session) return res.status(404).json({ error: 'Not found' })
    res.json(session)
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const session = await svc.deleteSession(req.trainerId, req.params.id)
    if (!session) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

router.post('/:id/clients/:clientId', async (req, res, next) => {
  try {
    const result = await svc.addSessionClient(req.trainerId, req.params.id, req.params.clientId)
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.status(201).json(result)
  } catch (e) { next(e) }
})

router.delete('/:id/clients/:clientId', async (req, res, next) => {
  try {
    const result = await svc.removeSessionClient(
      req.trainerId,
      req.params.id,
      req.params.clientId
    )
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

export default router
