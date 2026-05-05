import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status)
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div role="status" aria-label="Loading" className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }
  if (status === 'unauthenticated') return <Navigate to="/sign-in" replace />
  return <>{children}</>
}
