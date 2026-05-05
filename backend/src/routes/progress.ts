import { Router, Request } from 'express'
import { upload } from '../middleware/upload.js'
import * as svc from '../services/progressService.js'

const router = Router({ mergeParams: true })

type ClientReq = Request<{ clientId: string }>
type EntryReq = Request<{ clientId: string; entryId: string }>
type PhotoReq = Request<{ clientId: string; entryId: string; photoId: string }>

router.get('/', async (req: ClientReq, res, next) => {
  try {
    const result = await svc.listProgress(req.trainerId, req.params.clientId)
    if (!result) return res.status(404).json({ error: 'Client not found' })
    res.json(result)
  } catch (e) { next(e) }
})

router.post('/', async (req: ClientReq, res, next) => {
  try {
    const entry = await svc.createProgressEntry(req.trainerId, req.params.clientId, req.body)
    if (!entry) return res.status(404).json({ error: 'Client not found' })
    res.status(201).json(entry)
  } catch (e) { next(e) }
})

router.get('/:entryId', async (req: EntryReq, res, next) => {
  try {
    const entry = await svc.getProgressEntry(
      req.trainerId,
      req.params.clientId,
      req.params.entryId
    )
    if (!entry) return res.status(404).json({ error: 'Not found' })
    res.json(entry)
  } catch (e) { next(e) }
})

router.patch('/:entryId', async (req: EntryReq, res, next) => {
  try {
    const entry = await svc.updateProgressEntry(
      req.trainerId,
      req.params.clientId,
      req.params.entryId,
      req.body
    )
    if (!entry) return res.status(404).json({ error: 'Not found' })
    res.json(entry)
  } catch (e) { next(e) }
})

router.delete('/:entryId', async (req: EntryReq, res, next) => {
  try {
    const entry = await svc.deleteProgressEntry(
      req.trainerId,
      req.params.clientId,
      req.params.entryId
    )
    if (!entry) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

router.post('/:entryId/photos', upload.single('photo'), async (req: EntryReq, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const view = req.body.view as string
    if (!['front', 'side'].includes(view)) {
      return res.status(400).json({ error: 'view must be "front" or "side"' })
    }
    const storageUrl = `/uploads/${req.file.filename}`
    const photo = await svc.addProgressPhoto(
      req.trainerId,
      req.params.clientId,
      req.params.entryId,
      view,
      storageUrl
    )
    if (!photo) return res.status(400).json({ error: 'Entry not found or max 2 photos reached' })
    res.status(201).json(photo)
  } catch (e) { next(e) }
})

router.delete('/:entryId/photos/:photoId', async (req: PhotoReq, res, next) => {
  try {
    const photo = await svc.deleteProgressPhoto(
      req.trainerId,
      req.params.clientId,
      req.params.entryId,
      req.params.photoId
    )
    if (!photo) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

export default router
