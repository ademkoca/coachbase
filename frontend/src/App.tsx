import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { useAuthStore } from './store/authStore'
import { router } from './routes'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
})

function AuthWatcher() {
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser)
  const setTrainer = useAuthStore((s) => s.setTrainer)
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (user) {
        try {
          const { default: api } = await import('./lib/api')
          const { data } = await api.get('/auth/me')
          setTrainer(data)
        } catch {
          // trainer row may not exist yet (sign-up flow creates it right after)
        }
      } else {
        setTrainer(null)
      }
    })
  }, [setFirebaseUser, setTrainer])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthWatcher />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
