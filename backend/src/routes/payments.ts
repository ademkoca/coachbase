import { Router, Request } from 'express'
import * as svc from '../services/paymentsService.js'

const router = Router({ mergeParams: true }) // inherits :clientId from parent

type ClientReq = Request<{ clientId: string }>
type PaymentReq = Request<{ clientId: string; paymentId: string }>

router.get('/', async (req: ClientReq, res, next) => {
  try {
    res.json(await svc.listPayments(req.trainerId, req.params.clientId))
  } catch (e) { next(e) }
})

router.post('/', async (req: ClientReq, res, next) => {
  try {
    const payment = await svc.createPayment(req.trainerId, req.params.clientId, req.body)
    res.status(201).json(payment)
  } catch (e) { next(e) }
})

router.delete('/:paymentId', async (req: PaymentReq, res, next) => {
  try {
    const payment = await svc.deletePayment(req.trainerId, req.params.paymentId)
    if (!payment) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (e) { next(e) }
})

router.get('/coverage', async (req: ClientReq, res, next) => {
  try {
    const { date } = req.query as { date: string }
    if (!date) return res.status(400).json({ error: 'date query param required' })
    const result = await svc.checkCoverage(req.trainerId, req.params.clientId, date)
    res.json(result)
  } catch (e) { next(e) }
})

export default router
