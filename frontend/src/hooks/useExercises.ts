import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { Exercise } from '../types/api'

export function useExercises(filters?: { muscleGroup?: string; category?: string }) {
  return useQuery<Exercise[]>({
    queryKey: ['exercises', filters],
    queryFn: () => api.get('/exercises', { params: filters }).then((r) => r.data),
  })
}

export function useCreateExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Exercise>) => api.post('/exercises', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

export function useUpdateExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Exercise> & { id: string }) =>
      api.patch(`/exercises/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

export function useDeleteExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/exercises/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}
