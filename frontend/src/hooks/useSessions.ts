import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { Session, SessionDetail } from '../types/api'

interface SessionFilters {
  from?: string
  to?: string
  clientId?: string
  groupId?: string
  status?: string
}

export function useSessions(filters?: SessionFilters) {
  return useQuery<Session[]>({
    queryKey: ['sessions', filters],
    queryFn: () => api.get('/sessions', { params: filters }).then((r) => r.data),
  })
}

export function useSession(id: string) {
  return useQuery<SessionDetail>({
    queryKey: ['sessions', id],
    queryFn: () => api.get(`/sessions/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Session> & { clientIds?: string[] }) =>
      api.post('/sessions', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useUpdateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Session> & { id: string }) =>
      api.patch(`/sessions/${id}`, data).then((r) => r.data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['sessions', id] })
    },
  })
}

export function useCreateRecurringSessions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      title: string
      startDate: string
      endDate: string
      time: string
      daysOfWeek: number[]
      durationMinutes?: number
      workoutPlanId?: string
      groupId?: string
      clientIds?: string[]
      location?: string
      notes?: string
    }) => api.post('/sessions/recurring', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}
