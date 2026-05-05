import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import type { Trainer } from '../types/api'

export function useUpdateTrainer() {
  const setTrainer = useAuthStore((s) => s.setTrainer)
  return useMutation({
    mutationFn: (data: Partial<Pick<Trainer, 'displayName' | 'phone' | 'bio' | 'weightUnit' | 'measurementUnit' | 'feePerSession' | 'feeMonthly' | 'feeHalfYearly' | 'feeYearly' | 'staleClientThresholdDays'>>) =>
      api.patch<Trainer>('/auth/me', data).then((r) => r.data),
    onSuccess: (trainer) => setTrainer(trainer),
  })
}
