import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type {
  WorkoutLog,
  WorkoutLogSet,
  WorkoutLogSummary,
  PersonalRecord,
} from '../types/api'

export function useSessionLogs(sessionId: string | undefined, enabled = true) {
  return useQuery<WorkoutLog[]>({
    queryKey: ['workout-logs', 'session', sessionId],
    queryFn: () => api.get(`/workout-logs/sessions/${sessionId}`).then((r) => r.data),
    enabled: !!sessionId && enabled,
  })
}

export function useStartSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post(`/workout-logs/sessions/${sessionId}/start`).then((r) => r.data as WorkoutLog[]),
    onSuccess: (_d, sessionId) => {
      qc.invalidateQueries({ queryKey: ['workout-logs', 'session', sessionId] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useEndSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post(`/workout-logs/sessions/${sessionId}/end`).then((r) => r.data as WorkoutLog[]),
    onSuccess: (_d, sessionId) => {
      qc.invalidateQueries({ queryKey: ['workout-logs', 'session', sessionId] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['client-logs'] })
      qc.invalidateQueries({ queryKey: ['personal-records'] })
    },
  })
}

export function useUpdateLogNotes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      logId,
      notes,
    }: {
      sessionId: string
      logId: string
      notes: string | null
    }) => api.patch(`/workout-logs/${logId}`, { notes }).then((r) => r.data as WorkoutLog),
    onSuccess: (_d, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['workout-logs', 'session', sessionId] })
    },
  })
}

export function useUpsertSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      logId,
      logExerciseId,
      setNumber,
      reps,
      weightKg,
    }: {
      sessionId: string
      logId: string
      logExerciseId: string
      setNumber: number
      reps: number | null
      weightKg: number | null
    }) =>
      api
        .put(`/workout-logs/${logId}/exercises/${logExerciseId}/sets/${setNumber}`, {
          reps,
          weightKg,
        })
        .then((r) => r.data as WorkoutLogSet),
    onSuccess: (_d, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['workout-logs', 'session', sessionId] })
    },
  })
}

export function useAddLogExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      logId,
      exerciseId,
    }: {
      sessionId: string
      logId: string
      exerciseId: string
    }) =>
      api.post(`/workout-logs/${logId}/exercises`, { exerciseId }).then((r) => r.data),
    onSuccess: (_d, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['workout-logs', 'session', sessionId] })
    },
  })
}

export function useRemoveLogExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      logId,
      logExerciseId,
    }: {
      sessionId: string
      logId: string
      logExerciseId: string
    }) => api.delete(`/workout-logs/${logId}/exercises/${logExerciseId}`),
    onSuccess: (_d, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ['workout-logs', 'session', sessionId] })
    },
  })
}

export function useClientLogs(clientId: string | undefined) {
  return useQuery<WorkoutLogSummary[]>({
    queryKey: ['client-logs', clientId],
    queryFn: () => api.get(`/workout-logs/clients/${clientId}`).then((r) => r.data),
    enabled: !!clientId,
  })
}

export function useClientPRs(clientId: string | undefined) {
  return useQuery<PersonalRecord[]>({
    queryKey: ['personal-records', clientId],
    queryFn: () =>
      api.get(`/workout-logs/clients/${clientId}/personal-records`).then((r) => r.data),
    enabled: !!clientId,
  })
}
