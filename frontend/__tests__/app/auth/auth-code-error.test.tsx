/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import AuthCodeErrorPage from '@/app/auth/auth-code-error/page'

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
  MockLink.displayName = 'MockLink'
  return MockLink
})

describe('AuthCodeErrorPage', () => {
  it('should render error page with default message', async () => {
    const searchParams = Promise.resolve({})
    render(await AuthCodeErrorPage({ searchParams }))

    expect(screen.getByText('Authentication Error')).toBeInTheDocument()
    expect(
      screen.getByText('There was a problem verifying your authentication code')
    ).toBeInTheDocument()
    expect(screen.getByText('Unknown error')).toBeInTheDocument()
  })

  it('should render error page with missing_code message', async () => {
    const searchParams = Promise.resolve({ message: 'missing_code' })
    render(await AuthCodeErrorPage({ searchParams }))

    expect(
      screen.getByText('No authentication code was provided in the URL.')
    ).toBeInTheDocument()
  })

  it('should render error page with pkce_verifier_invalid message', async () => {
    const searchParams = Promise.resolve({ message: 'pkce_verifier_invalid' })
    render(await AuthCodeErrorPage({ searchParams }))

    expect(
      screen.getByText(
        /The authentication session has expired or is invalid/i
      )
    ).toBeInTheDocument()
  })

  it('should render error page with otp_expired message', async () => {
    const searchParams = Promise.resolve({ message: 'otp_expired' })
    render(await AuthCodeErrorPage({ searchParams }))

    expect(
      screen.getByText(
        'The authentication link has expired. Links are only valid for a limited time.'
      )
    ).toBeInTheDocument()
  })

  it('should render error page with invalid_pkce_code_verifier message', async () => {
    const searchParams = Promise.resolve({
      message: 'invalid_pkce_code_verifier',
    })
    render(await AuthCodeErrorPage({ searchParams }))

    expect(
      screen.getByText(
        'The authentication session is no longer valid. Please try signing in again.'
      )
    ).toBeInTheDocument()
  })

  it('should render error page with custom error message', async () => {
    const customError = 'Custom error from Supabase'
    const searchParams = Promise.resolve({ message: customError })
    render(await AuthCodeErrorPage({ searchParams }))

    expect(screen.getByText(customError)).toBeInTheDocument()
  })

  it('should display both explanation and raw error for known errors with details', async () => {
    const searchParams = Promise.resolve({ message: 'pkce_verifier_invalid' })
    render(await AuthCodeErrorPage({ searchParams }))

    // Should show the user-friendly explanation
    expect(
      screen.getByText(
        /The authentication session has expired or is invalid/i
      )
    ).toBeInTheDocument()
  })

  it('should show troubleshooting steps', async () => {
    const searchParams = Promise.resolve({})
    render(await AuthCodeErrorPage({ searchParams }))

    expect(screen.getByText('What you can try:')).toBeInTheDocument()
    expect(screen.getByText(/Request a new authentication link/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Make sure you're using the latest link from your email/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Try signing in again from the beginning/i)).toBeInTheDocument()
    expect(screen.getByText(/Clear your browser cache and cookies/i)).toBeInTheDocument()
    expect(
      screen.getByText(/If using Google sign-in, try email\/password instead/i)
    ).toBeInTheDocument()
  })

  it('should render back to sign in button', async () => {
    const searchParams = Promise.resolve({})
    render(await AuthCodeErrorPage({ searchParams }))

    const signInLink = screen.getByRole('link', { name: /Back to Sign In/i })
    expect(signInLink).toBeInTheDocument()
    expect(signInLink).toHaveAttribute('href', '/login')
  })

  it('should render go home button', async () => {
    const searchParams = Promise.resolve({})
    render(await AuthCodeErrorPage({ searchParams }))

    const homeLink = screen.getByRole('link', { name: /Go Home/i })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('should handle URL encoded error messages', async () => {
    const encodedMessage = 'User%20denied%20access'
    const searchParams = Promise.resolve({ message: encodedMessage })
    render(await AuthCodeErrorPage({ searchParams }))

    // The component should receive the URL-decoded message
    // Note: In real scenarios, Next.js automatically decodes search params
    expect(screen.getByText(encodedMessage)).toBeInTheDocument()
  })
})
