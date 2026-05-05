import { eq, and, desc, lte, gte, ne, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { payments, sessions, sessionClients, clients } from '../db/schema.js'

export type BillingType = 'per_session' | 'monthly' | 'half_yearly' | 'yearly'

function computePeriodEnd(billingType: BillingType, periodStart: string): string {
  const d = new Date(periodStart)
  switch (billingType) {
    case 'per_session':
      d.setDate(d.getDate() + 30)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + 1)
      d.setDate(d.getDate() - 1)
      break
    case 'half_yearly':
      d.setMonth(d.getMonth() + 6)
      d.setDate(d.getDate() - 1)
      break
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1)
      d.setDate(d.getDate() - 1)
      break
  }
  return d.toISOString().slice(0, 10)
}

export async function listExpiringPayments(trainerId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  return db
    .select({
      id: payments.id,
      clientId: payments.clientId,
      clientName: clients.name,
      billingType: payments.billingType,
      amount: payments.amount,
      periodEnd: payments.periodEnd,
    })
    .from(payments)
    .innerJoin(clients, eq(payments.clientId, clients.id))
    .where(
      and(
        eq(payments.trainerId, trainerId),
        eq(payments.status, 'paid'),
        gte(payments.periodEnd, today),
        lte(payments.periodEnd, in7Days)
      )
    )
    .orderBy(payments.periodEnd)
}

export async function listPayments(trainerId: string, clientId: string) {
  return db
    .select()
    .from(payments)
    .where(and(eq(payments.trainerId, trainerId), eq(payments.clientId, clientId)))
    .orderBy(desc(payments.periodStart))
}

export async function createPayment(
  trainerId: string,
  clientId: string,
  data: {
    billingType: BillingType
    amount: string
    sessionsIncluded?: number
    periodStart: string
    status?: string
    notes?: string
  }
) {
  const periodEnd = computePeriodEnd(data.billingType, data.periodStart)
  const [payment] = await db
    .insert(payments)
    .values({
      trainerId,
      clientId,
      billingType: data.billingType,
      amount: data.amount,
      sessionsIncluded: data.sessionsIncluded ?? null,
      periodStart: data.periodStart,
      periodEnd,
      status: data.status ?? 'paid',
      notes: data.notes ?? null,
    })
    .returning()
  return payment
}

export async function deletePayment(trainerId: string, paymentId: string) {
  const [payment] = await db
    .delete(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.trainerId, trainerId)))
    .returning()
  return payment ?? null
}

export async function checkCoverage(
  trainerId: string,
  clientId: string,
  sessionDate: string // YYYY-MM-DD
): Promise<{ covered: boolean; payment: typeof payments.$inferSelect | null }> {
  // Find a paid payment whose period covers the session date
  const candidates = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.trainerId, trainerId),
        eq(payments.clientId, clientId),
        eq(payments.status, 'paid'),
        lte(payments.periodStart, sessionDate),
        gte(payments.periodEnd, sessionDate)
      )
    )

  for (const payment of candidates) {
    if (payment.billingType !== 'per_session') {
      return { covered: true, payment }
    }

    // For per_session: count non-cancelled sessions in the period for this client
    const sessionRows = await db
      .select({ id: sessions.id })
      .from(sessions)
      .innerJoin(sessionClients, eq(sessionClients.sessionId, sessions.id))
      .where(
        and(
          eq(sessionClients.clientId, clientId),
          eq(sessions.trainerId, trainerId),
          ne(sessions.status, 'cancelled'),
          gte(sessions.scheduledAt, new Date(`${payment.periodStart}T00:00:00`)),
          lte(sessions.scheduledAt, new Date(`${payment.periodEnd}T23:59:59`))
        )
      )

    const used = sessionRows.length
    const included = payment.sessionsIncluded ?? 0
    if (used < included) {
      return { covered: true, payment }
    }
  }

  return { covered: false, payment: null }
}

export async function checkCoverageForClients(
  trainerId: string,
  clientIds: string[],
  sessionDate: string
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}
  await Promise.all(
    clientIds.map(async (clientId) => {
      const { covered } = await checkCoverage(trainerId, clientId, sessionDate)
      results[clientId] = covered
    })
  )
  return results
}
