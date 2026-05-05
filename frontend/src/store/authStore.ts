import { create } from 'zustand'
import type { User } from 'firebase/auth'
import type { Trainer } from '../types/api'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  firebaseUser: User | null
  trainer: Trainer | null
  setFirebaseUser: (user: User | null) => void
  setTrainer: (trainer: Trainer | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  firebaseUser: null,
  trainer: null,
  setFirebaseUser: (user) =>
    set({ firebaseUser: user, status: user ? 'authenticated' : 'unauthenticated' }),
  setTrainer: (trainer) => set({ trainer }),
}))
