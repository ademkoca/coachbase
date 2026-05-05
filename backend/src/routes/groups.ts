import { Router } from 'express'
import * as svc from '../services/groupsService.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    res.json(await svc.listGroups(req.trainerId))
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const group = await svc.createGroup(req.trainerId, req.body)
    res.status(201).json(group)
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const group = await svc.getGroup(req.trainerId, req.params.id)
    if (!group) return res.status(404).json({ error: 'Not found' })
    res.json(group)
  } catch (e) { next(e) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const group = await svc.updateGroup(req.trainerId, req.params.id, req.body)
    if (!group) return res.status(404).json({ error: 'Not found' })
    res.json(group)
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const group = await svc.deleteGroup(req.trainerId, req.params.id)
    if (!group) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

router.post('/:id/members', async (req, res, next) => {
  try {
    const result = await svc.addGroupMembers(req.trainerId, req.params.id, req.body.clientIds)
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.json({ added: result })
  } catch (e) { next(e) }
})

router.delete('/:id/members/:clientId', async (req, res, next) => {
  try {
    const result = await svc.removeGroupMember(
      req.trainerId,
      req.params.id,
      req.params.clientId
    )
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

export default router
