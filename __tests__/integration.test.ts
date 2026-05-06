// Test example - Authentication flow
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    }
  }
}))

describe('Authentication Flow', () => {
  
  it('should render login form', () => {
    // render(<LoginForm />)
    // expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    // expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument()
  })

  it('should submit login form with valid credentials', async () => {
    // const user = userEvent.setup()
    // render(<LoginForm />)
    
    // await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    // await user.type(screen.getByPlaceholderText('Contraseña'), 'password123')
    // await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    
    // await waitFor(() => {
    //   expect(screen.getByText(/Autenticando/i)).toBeInTheDocument()
    // })
  })

  it('should show error on failed login', async () => {
    // const { supabase } = await import('@/lib/supabase')
    // supabase.auth.signInWithPassword.mockRejectedValueOnce({
    //   message: 'Credenciales inválidas'
    // })
    
    // const user = userEvent.setup()
    // render(<LoginForm />)
    
    // await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    // await user.type(screen.getByPlaceholderText('Contraseña'), 'wrongpassword')
    // await user.click(screen.getByRole('button', { name: /Iniciar sesión/i }))
    
    // await waitFor(() => {
    //   expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument()
    // })
  })
})

describe('Dashboard Metrics', () => {
  
  it('should load and display dashboard KPIs', async () => {
    // render(<Dashboard />)
    // expect(screen.getByText(/Transacciones/i)).toBeInTheDocument()
    // await waitFor(() => {
    //   expect(screen.getByTestId('revenue-chart')).toBeInTheDocument()
    // })
  })

  it('should update metrics on interval', async () => {
    // vi.useFakeTimers()
    // render(<Dashboard />)
    
    // const initialValue = screen.getByTestId('total-revenue').textContent
    // vi.advanceTimersByTime(30000) // Advance 30 seconds
    
    // await waitFor(() => {
    //   expect(screen.getByTestId('total-revenue').textContent).not.toBe(initialValue)
    // })
    
    // vi.useRealTimers()
  })
})

describe('Payment Integration', () => {
  
  it('should redirect to Stripe checkout', async () => {
    // const user = userEvent.setup()
    // render(<PaymentButton />)
    
    // await user.click(screen.getByRole('button', { name: /Pagar/i }))
    
    // await waitFor(() => {
    //   expect(window.location.href).toContain('checkout.stripe.com')
    // })
  })

  it('should validate payment amount', async () => {
    // render(<PaymentForm />)
    
    // const amountInput = screen.getByLabelText(/Monto/i) as HTMLInputElement
    // await userEvent.clear(amountInput)
    // await userEvent.type(amountInput, '0')
    
    // expect(screen.getByText(/Monto debe ser mayor a 0/i)).toBeInTheDocument()
  })
})
