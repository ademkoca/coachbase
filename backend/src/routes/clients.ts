import { Router } from 'express'
import * as svc from '../services/clientsService.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    res.json(await svc.listClients(req.trainerId))
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const client = await svc.createClient(req.trainerId, req.body)
    res.status(201).json(client)
  } catch (e) { next(e) }
})

router.get('/stale', async (req, res, next) => {
  try {
    res.json(await svc.listStaleClients(req.trainerId))
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const client = await svc.getClient(req.trainerId, req.params.id)
    if (!client) return res.status(404).json({ error: 'Not found' })
    res.json(client)
  } catch (e) { next(e) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const client = await svc.updateClient(req.trainerId, req.params.id, req.body)
    if (!client) return res.status(404).json({ error: 'Not found' })
    res.json(client)
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const client = await svc.deleteClient(req.trainerId, req.params.id)
    if (!client) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

export default router
