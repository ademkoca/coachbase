import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { Group, GroupDetail } from '../types/api'

export function useGroups() {
  return useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then((r) => r.data),
  })
}

export function useGroup(id: string) {
  return useQuery<GroupDetail>({
    queryKey: ['groups', id],
    queryFn: () => api.get(`/groups/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post('/groups', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useUpdateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string }) =>
      api.patch(`/groups/${id}`, data).then((r) => r.data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      qc.invalidateQueries({ queryKey: ['groups', id] })
    },
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/groups/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useAddGroupMembers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, clientIds }: { groupId: string; clientIds: string[] }) =>
      api.post(`/groups/${groupId}/members`, { clientIds }).then((r) => r.data),
    onSuccess: (_d, { groupId }) => qc.invalidateQueries({ queryKey: ['groups', groupId] }),
  })
}

export function useRemoveGroupMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, clientId }: { groupId: string; clientId: string }) =>
      api.delete(`/groups/${groupId}/members/${clientId}`),
    onSuccess: (_d, { groupId }) => qc.invalidateQueries({ queryKey: ['groups', groupId] }),
  })
}
