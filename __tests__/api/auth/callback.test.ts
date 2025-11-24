/**
 * @jest-environment node
 */
import { GET } from '@/app/api/auth/callback/route'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

jest.mock('@/lib/supabase/server')
jest.mock('next/server', () => ({
  NextResponse: {
    redirect: jest.fn((url: string) => ({
      status: 302,
      url,
    })),
  },
}))

const mockSupabase = {
  auth: {
    exchangeCodeForSession: jest.fn(),
  },
}

describe('GET /api/auth/callback', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    // Restore original NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
      configurable: true,
    })
  })

  const setNodeEnv = (env: string) => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: env,
      writable: true,
      configurable: true,
    })
  }

  it('should redirect to error page if no code is provided', async () => {
    const request = new Request('http://localhost:3000/api/auth/callback')

    await GET(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/auth/auth-code-error?message=missing_code')
    )
  })

  it('should redirect to error page if OAuth error is present', async () => {
    const request = new Request(
      'http://localhost:3000/api/auth/callback?error=access_denied&error_description=User%20denied%20access'
    )

    await GET(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/auth/auth-code-error?message=User%20denied%20access')
    )
  })

  it('should redirect to error page if code exchange fails', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: {
        message: 'Invalid code',
        code: 'invalid_code',
        status: 400,
      },
    })

    const request = new Request(
      'http://localhost:3000/api/auth/callback?code=test-code'
    )

    await GET(request)

    expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code')
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/auth/auth-code-error?message=Invalid%20code')
    )
  })

  it('should redirect to dashboard on successful authentication in development', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: null,
    })

    // Mock development environment
    setNodeEnv('development')

    const request = new Request(
      'http://localhost:3000/api/auth/callback?code=valid-code'
    )

    await GET(request)

    expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('valid-code')
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/dashboard'
    )
  })

  it('should redirect to custom next path if provided', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: null,
    })

    // Mock development environment
    setNodeEnv('development')

    const request = new Request(
      'http://localhost:3000/api/auth/callback?code=valid-code&next=/settings'
    )

    await GET(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/settings'
    )
  })

  it('should use forwarded host in production', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: null,
    })

    // Mock production environment
    setNodeEnv('production')

    const request = new Request(
      'http://localhost:3000/api/auth/callback?code=valid-code',
      {
        headers: {
          'x-forwarded-host': 'goodhealth-three.vercel.app',
          'x-forwarded-proto': 'https',
        },
      }
    )

    await GET(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      'https://goodhealth-three.vercel.app/dashboard'
    )
  })

  it('should default to https if forwarded proto is not provided in production', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: null,
    })

    // Mock production environment
    setNodeEnv('production')

    const request = new Request(
      'http://localhost:3000/api/auth/callback?code=valid-code',
      {
        headers: {
          'x-forwarded-host': 'goodhealth-three.vercel.app',
        },
      }
    )

    await GET(request)

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      'https://goodhealth-three.vercel.app/dashboard'
    )
  })

  it('should log OAuth errors to console', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const request = new Request(
      'http://localhost:3000/api/auth/callback?error=access_denied&error_description=User%20denied%20access'
    )

    await GET(request)

    expect(consoleSpy).toHaveBeenCalledWith('OAuth error:', {
      error_code: 'access_denied',
      error_description: 'User denied access',
    })

    consoleSpy.mockRestore()
  })

  it('should log code exchange errors to console', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: {
        message: 'Invalid code',
        code: 'invalid_code',
        status: 400,
      },
    })

    const request = new Request(
      'http://localhost:3000/api/auth/callback?code=test-code'
    )

    await GET(request)

    expect(consoleSpy).toHaveBeenCalledWith('Auth code exchange error:', {
      error: 'Invalid code',
      code: 'invalid_code',
      status: 400,
    })

    consoleSpy.mockRestore()
  })
})
