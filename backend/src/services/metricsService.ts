import { sql, eq, and, gte, lte } from 'drizzle-orm'
import { db } from '../db/client.js'
import { payments, clients, sessions, sessionClients } from '../db/schema.js'

function fmtMonth(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function getMetrics(trainerId: string, from: string, to: string) {
  const [revenueRows, clientRows, sessionRows, topClientRows, avgRows] = await Promise.all([
    // Revenue by month
    db
      .select({
        month: sql<string>`date_trunc('month', ${payments.periodStart})::date`,
        revenue: sql<number>`SUM(${payments.amount}::numeric)`,
      })
      .from(payments)
      .where(and(
        eq(payments.trainerId, trainerId),
        gte(payments.periodStart, from),
        lte(payments.periodStart, to),
      ))
      .groupBy(sql`date_trunc('month', ${payments.periodStart})`)
      .orderBy(sql`date_trunc('month', ${payments.periodStart})`),

    // New clients per month
    db
      .select({
        month: sql<string>`date_trunc('month', ${clients.createdAt})::date`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(clients)
      .where(and(
        eq(clients.trainerId, trainerId),
        gte(clients.createdAt, new Date(`${from}T00:00:00`)),
        lte(clients.createdAt, new Date(`${to}T23:59:59`)),
      ))
      .groupBy(sql`date_trunc('month', ${clients.createdAt})`)
      .orderBy(sql`date_trunc('month', ${clients.createdAt})`),

    // Session volume by month (completed + cancelled only)
    db
      .select({
        month: sql<string>`date_trunc('month', ${sessions.scheduledAt})::date`,
        status: sessions.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(sessions)
      .where(and(
        eq(sessions.trainerId, trainerId),
        gte(sessions.scheduledAt, new Date(`${from}T00:00:00`)),
        lte(sessions.scheduledAt, new Date(`${to}T23:59:59`)),
        sql`${sessions.status} IN ('completed', 'cancelled')`,
      ))
      .groupBy(sql`date_trunc('month', ${sessions.scheduledAt})`, sessions.status)
      .orderBy(sql`date_trunc('month', ${sessions.scheduledAt})`),

    // Top 10 clients by lifetime revenue
    db
      .select({
        id: clients.id,
        name: clients.name,
        revenue: sql<number>`SUM(${payments.amount}::numeric)`,
      })
      .from(payments)
      .innerJoin(clients, eq(payments.clientId, clients.id))
      .where(eq(payments.trainerId, trainerId))
      .groupBy(clients.id, clients.name)
      .orderBy(sql`SUM(${payments.amount}::numeric) DESC`)
      .limit(10),

    // Avg completed sessions per active client per month
    db
      .select({
        month: sql<string>`date_trunc('month', ${sessions.scheduledAt})::date`,
        clientCount: sql<number>`COUNT(DISTINCT ${sessionClients.clientId})::int`,
        sessionCount: sql<number>`COUNT(*)::int`,
      })
      .from(sessions)
      .innerJoin(sessionClients, eq(sessionClients.sessionId, sessions.id))
      .where(and(
        eq(sessions.trainerId, trainerId),
        eq(sessions.status, 'completed'),
        gte(sessions.scheduledAt, new Date(`${from}T00:00:00`)),
        lte(sessions.scheduledAt, new Date(`${to}T23:59:59`)),
      ))
      .groupBy(sql`date_trunc('month', ${sessions.scheduledAt})`)
      .orderBy(sql`date_trunc('month', ${sessions.scheduledAt})`),
  ])

  // Shape session rows into { month, completed, cancelled }
  const sessionsByMonth: Record<string, { month: string; completed: number; cancelled: number }> = {}
  for (const row of sessionRows) {
    const key = fmtMonth(new Date(row.month))
    if (!sessionsByMonth[key]) sessionsByMonth[key] = { month: key, completed: 0, cancelled: 0 }
    if (row.status === 'completed') sessionsByMonth[key].completed = row.count
    if (row.status === 'cancelled') sessionsByMonth[key].cancelled = row.count
  }

  return {
    revenueByMonth: revenueRows.map((r) => ({
      month: fmtMonth(new Date(r.month)),
      revenue: Number(r.revenue),
    })),
    clientsByMonth: clientRows.map((r) => ({
      month: fmtMonth(new Date(r.month)),
      count: r.count,
    })),
    sessionsByMonth: Object.values(sessionsByMonth),
    topClientsByRevenue: topClientRows.map((r) => ({
      id: r.id,
      name: r.name,
      revenue: Number(r.revenue),
    })),
    avgSessionsPerClientByMonth: avgRows.map((r) => ({
      month: fmtMonth(new Date(r.month)),
      avg: r.clientCount > 0 ? Number((r.sessionCount / r.clientCount).toFixed(1)) : 0,
    })),
  }
}
