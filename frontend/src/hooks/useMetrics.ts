import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export interface MetricsData {
  revenueByMonth: { month: string; revenue: number }[]
  clientsByMonth: { month: string; count: number }[]
  sessionsByMonth: { month: string; completed: number; cancelled: number }[]
  topClientsByRevenue: { id: string; name: string; revenue: number }[]
  avgSessionsPerClientByMonth: { month: string; avg: number }[]
}

export function useMetrics(from: string, to: string) {
  return useQuery<MetricsData>({
    queryKey: ['metrics', from, to],
    queryFn: () => api.get(`/metrics?from=${from}&to=${to}`).then((r) => r.data),
    enabled: !!from && !!to,
  })
}
