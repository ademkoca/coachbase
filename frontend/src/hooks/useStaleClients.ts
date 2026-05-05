import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { StaleClient } from '../types/api'

export function useStaleClients() {
  return useQuery<StaleClient[]>({
    queryKey: ['stale-clients'],
    queryFn: () => api.get('/clients/stale').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
