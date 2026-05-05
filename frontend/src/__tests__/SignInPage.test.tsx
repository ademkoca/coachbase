import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SignInPage from '../pages/SignInPage'

// Mock firebase auth
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
}))
vi.mock('../firebase', () => ({ auth: {} }))

const renderPage = () =>
  render(
    <MemoryRouter>
      <SignInPage />
    </MemoryRouter>
  )

describe('SignInPage', () => {
  it('renders email and password fields', () => {
    renderPage()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows link to sign up', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows error when submission fails', async () => {
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce(
      new Error('Wrong password')
    )
    renderPage()
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' },
    })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }))
    const error = await screen.findByText(/wrong password/i)
    expect(error).toBeInTheDocument()
  })
})
