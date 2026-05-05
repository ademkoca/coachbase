import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { ProgressEntry } from '../types/api'

export function useProgress(clientId: string) {
  return useQuery<ProgressEntry[]>({
    queryKey: ['progress', clientId],
    queryFn: () => api.get(`/clients/${clientId}/progress`).then((r) => r.data),
    enabled: !!clientId,
  })
}

export function useCreateProgressEntry(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<ProgressEntry>) =>
      api.post(`/clients/${clientId}/progress`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress', clientId] }),
  })
}

export function useUpdateProgressEntry(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ProgressEntry> & { id: string }) =>
      api.patch(`/clients/${clientId}/progress/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress', clientId] }),
  })
}

export function useDeleteProgressEntry(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${clientId}/progress/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress', clientId] }),
  })
}

export function useUploadProgressPhoto(clientId: string, entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, view }: { file: File; view: 'front' | 'side' }) => {
      const form = new FormData()
      form.append('photo', file)
      form.append('view', view)
      return api
        .post(`/clients/${clientId}/progress/${entryId}/photos`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress', clientId] }),
  })
}

export function useDeleteProgressPhoto(clientId: string, entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (photoId: string) =>
      api.delete(`/clients/${clientId}/progress/${entryId}/photos/${photoId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress', clientId] }),
  })
}
