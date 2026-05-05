import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from '../routes/ProtectedRoute'
import { useAuthStore } from '../store/authStore'

const renderRoute = () =>
  render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    </MemoryRouter>
  )

describe('ProtectedRoute', () => {
  it('shows spinner when loading', () => {
    useAuthStore.setState({ status: 'loading', firebaseUser: null, trainer: null })
    renderRoute()
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    useAuthStore.setState({ status: 'authenticated', firebaseUser: { uid: 'x' } as never, trainer: null })
    renderRoute()
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('does not render children when unauthenticated', () => {
    useAuthStore.setState({ status: 'unauthenticated', firebaseUser: null, trainer: null })
    renderRoute()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })
})
