import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { WorkoutPlan, WorkoutPlanDetail, PlanExercise } from '../types/api'

export function useWorkoutPlans() {
  return useQuery<WorkoutPlan[]>({
    queryKey: ['workout-plans'],
    queryFn: () => api.get('/workout-plans').then((r) => r.data),
  })
}

export function useWorkoutPlan(id: string) {
  return useQuery<WorkoutPlanDetail>({
    queryKey: ['workout-plans', id],
    queryFn: () => api.get(`/workout-plans/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateWorkoutPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post('/workout-plans', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-plans'] }),
  })
}

export function useUpdateWorkoutPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string }) =>
      api.patch(`/workout-plans/${id}`, data).then((r) => r.data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['workout-plans'] })
      qc.invalidateQueries({ queryKey: ['workout-plans', id] })
    },
  })
}

export function useDeleteWorkoutPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workout-plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-plans'] }),
  })
}

export function useReplacePlanExercises() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      planId,
      exercises,
    }: {
      planId: string
      exercises: Partial<PlanExercise & { exerciseId: string }>[]
    }) => api.put(`/workout-plans/${planId}/exercises`, exercises).then((r) => r.data),
    onSuccess: (_d, { planId }) =>
      qc.invalidateQueries({ queryKey: ['workout-plans', planId] }),
  })
}
