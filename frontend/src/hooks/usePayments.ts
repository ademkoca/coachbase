import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { Payment, BillingType } from '../types/api'

export function usePayments(clientId: string) {
  return useQuery<Payment[]>({
    queryKey: ['payments', clientId],
    queryFn: () => api.get(`/clients/${clientId}/payments`).then((r) => r.data),
    enabled: !!clientId,
  })
}

export function useCreatePayment(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      billingType: BillingType
      amount: string
      sessionsIncluded?: number
      periodStart: string
      status?: string
      notes?: string
    }) => api.post<Payment>(`/clients/${clientId}/payments`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments', clientId] }),
  })
}

export function useDeletePayment(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: string) => api.delete(`/clients/${clientId}/payments/${paymentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments', clientId] }),
  })
}

export function useExpiringPayments() {
  return useQuery<{
    id: string
    clientId: string
    clientName: string
    billingType: string
    amount: string
    periodEnd: string
  }[]>({
    queryKey: ['payments', 'expiring'],
    queryFn: () => api.get('/payments/expiring').then((r) => r.data),
  })
}

export function useCheckCoverage(clientIds: string[], date: string) {
  return useQuery<Record<string, boolean>>({
    queryKey: ['coverage', clientIds, date],
    queryFn: () => api.post('/payments/coverage-check', { clientIds, date }).then((r) => r.data),
    enabled: clientIds.length > 0 && !!date,
  })
}
