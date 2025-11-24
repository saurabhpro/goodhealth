/**
 * @jest-environment node
 */
import { signUp, signInWithGoogle, resetPassword } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

jest.mock('@/lib/supabase/server')
jest.mock('next/headers')
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithOAuth: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  },
}

const mockHeaders = {
  get: jest.fn(),
}

describe('Auth Actions', () => {
  const originalAppUrl = process.env.APP_URL
  const originalNextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL
  const originalVercelUrl = process.env.VERCEL_URL

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
    ;(headers as jest.Mock).mockResolvedValue(mockHeaders)
    // Reset header mocks to return null by default
    mockHeaders.get.mockReturnValue(null)
  })

  afterEach(() => {
    // Restore original environment variables
    if (originalAppUrl !== undefined) {
      process.env.APP_URL = originalAppUrl
    } else {
      delete process.env.APP_URL
    }

    if (originalNextPublicAppUrl !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = originalNextPublicAppUrl
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL
    }

    if (originalVercelUrl !== undefined) {
      process.env.VERCEL_URL = originalVercelUrl
    } else {
      delete process.env.VERCEL_URL
    }
  })

  describe('signUp', () => {
    it('should use APP_URL when available', async () => {
      process.env.APP_URL = 'https://goodhealth-three.vercel.app'
      delete process.env.NEXT_PUBLIC_APP_URL

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('fullName', 'Test User')

      await signUp(formData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'https://goodhealth-three.vercel.app/api/auth/callback',
          data: {
            full_name: 'Test User',
          },
        },
      })
    })

    it('should fallback to NEXT_PUBLIC_APP_URL when APP_URL is not set', async () => {
      delete process.env.APP_URL
      process.env.NEXT_PUBLIC_APP_URL = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('fullName', 'Test User')

      await signUp(formData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'https://goodhealth-three.vercel.app/api/auth/callback',
          data: {
            full_name: 'Test User',
          },
        },
      })
    })

    it('should fallback to origin header when no env vars are set', async () => {
      delete process.env.APP_URL
      delete process.env.NEXT_PUBLIC_APP_URL
      mockHeaders.get.mockReturnValue('http://localhost:3000')

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('fullName', 'Test User')

      await signUp(formData)

      expect(mockHeaders.get).toHaveBeenCalledWith('origin')
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000/api/auth/callback',
          data: {
            full_name: 'Test User',
          },
        },
      })
    })

    it('should prefer APP_URL over NEXT_PUBLIC_APP_URL when both are set', async () => {
      process.env.APP_URL = 'https://goodhealth-production.vercel.app'
      process.env.NEXT_PUBLIC_APP_URL = 'https://goodhealth-staging.vercel.app'

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('fullName', 'Test User')

      await signUp(formData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            emailRedirectTo: 'https://goodhealth-production.vercel.app/api/auth/callback',
          }),
        })
      )
    })

    it('should return error when signUp fails', async () => {
      process.env.APP_URL = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already in use' },
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('fullName', 'Test User')

      const result = await signUp(formData)

      expect(result).toEqual({ error: 'Email already in use' })
    })

    it('should return success when signUp succeeds', async () => {
      process.env.APP_URL = 'https://goodhealth-three.vercel.app'

      const mockData = { user: { id: '123', email: 'test@example.com' } }
      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockData,
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('fullName', 'Test User')

      const result = await signUp(formData)

      expect(result).toEqual({ success: true, data: mockData })
    })
  })

  describe('signInWithGoogle', () => {
    it('should use APP_URL when available', async () => {
      process.env.APP_URL = 'https://goodhealth-three.vercel.app'
      delete process.env.NEXT_PUBLIC_APP_URL

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      })

      await signInWithGoogle()

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://goodhealth-three.vercel.app/api/auth/callback',
        },
      })
    })

    it('should fallback to NEXT_PUBLIC_APP_URL when APP_URL is not set', async () => {
      delete process.env.APP_URL
      process.env.NEXT_PUBLIC_APP_URL = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      })

      await signInWithGoogle()

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://goodhealth-three.vercel.app/api/auth/callback',
        },
      })
    })

    it('should fallback to origin header when no env vars are set', async () => {
      delete process.env.APP_URL
      delete process.env.NEXT_PUBLIC_APP_URL
      mockHeaders.get.mockReturnValue('http://localhost:3000')

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      })

      await signInWithGoogle()

      expect(mockHeaders.get).toHaveBeenCalledWith('origin')
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/api/auth/callback',
        },
      })
    })

    it('should prefer APP_URL over NEXT_PUBLIC_APP_URL when both are set', async () => {
      process.env.APP_URL = 'https://goodhealth-production.vercel.app'
      process.env.NEXT_PUBLIC_APP_URL = 'https://goodhealth-staging.vercel.app'

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      })

      await signInWithGoogle()

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://goodhealth-production.vercel.app/api/auth/callback',
        },
      })
    })

    it('should redirect to OAuth URL when successful', async () => {
      process.env.APP_URL = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      })

      await signInWithGoogle()

      expect(redirect).toHaveBeenCalledWith('https://accounts.google.com/oauth')
    })

    it('should return error when OAuth fails', async () => {
      process.env.APP_URL = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth provider not configured' },
      })

      const result = await signInWithGoogle()

      expect(result).toEqual({ error: 'OAuth provider not configured' })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should not redirect if no URL is returned', async () => {
      process.env.APP_URL = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: null },
        error: null,
      })

      await signInWithGoogle()

      expect(redirect).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('should use APP_URL when available', async () => {
      process.env.APP_URL = 'https://goodhealth-three.vercel.app'
      delete process.env.NEXT_PUBLIC_APP_URL

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')

      await resetPassword(formData)

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'https://goodhealth-three.vercel.app/auth/update-password',
        }
      )
    })

    it('should fallback to NEXT_PUBLIC_APP_URL when APP_URL is not set', async () => {
      delete process.env.APP_URL
      process.env.NEXT_PUBLIC_APP_URL = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')

      await resetPassword(formData)

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'https://goodhealth-three.vercel.app/auth/update-password',
        }
      )
    })

    it('should fallback to origin header when no env vars are set', async () => {
      delete process.env.APP_URL
      delete process.env.NEXT_PUBLIC_APP_URL
      mockHeaders.get.mockReturnValue('http://localhost:3000')

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')

      await resetPassword(formData)

      expect(mockHeaders.get).toHaveBeenCalledWith('origin')
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/auth/update-password',
        }
      )
    })

    it('should prefer APP_URL over NEXT_PUBLIC_APP_URL when both are set', async () => {
      process.env.APP_URL = 'https://goodhealth-production.vercel.app'
      process.env.NEXT_PUBLIC_APP_URL = 'https://goodhealth-staging.vercel.app'

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')

      await resetPassword(formData)

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'https://goodhealth-production.vercel.app/auth/update-password',
        }
      )
    })

    it('should return error when reset fails', async () => {
      process.env.APP_URL = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')

      const result = await resetPassword(formData)

      expect(result).toEqual({ error: 'User not found' })
    })

    it('should return success when reset succeeds', async () => {
      process.env.APP_URL = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')

      const result = await resetPassword(formData)

      expect(result).toEqual({ success: true })
    })
  })

  describe('getAppUrl priority order (preview deployment fix)', () => {
    describe('signInWithGoogle - URL priority', () => {
      it('should prioritize origin header over all environment variables', async () => {
        // Set all possible env vars
        process.env.APP_URL = 'https://goodhealth-production.vercel.app'
        process.env.NEXT_PUBLIC_APP_URL = 'https://goodhealth-staging.vercel.app'
        process.env.VERCEL_URL = 'goodhealth-vercel.vercel.app'

        // But origin header should win
        mockHeaders.get.mockImplementation((header: string) => {
          if (header === 'origin') return 'https://goodhealth-preview-abc123.vercel.app'
          return null
        })

        mockSupabase.auth.signInWithOAuth.mockResolvedValue({
          data: { url: 'https://accounts.google.com/oauth' },
          error: null,
        })

        await signInWithGoogle()

        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: 'https://goodhealth-preview-abc123.vercel.app/api/auth/callback',
          },
        })
      })

      it('should use host + protocol when origin is not available', async () => {
        process.env.APP_URL = 'https://goodhealth-production.vercel.app'
        process.env.NEXT_PUBLIC_APP_URL = 'https://goodhealth-staging.vercel.app'

        mockHeaders.get.mockImplementation((header: string) => {
          if (header === 'origin') return null
          if (header === 'host') return 'goodhealth-preview-xyz789.vercel.app'
          if (header === 'x-forwarded-proto') return 'https'
          return null
        })

        mockSupabase.auth.signInWithOAuth.mockResolvedValue({
          data: { url: 'https://accounts.google.com/oauth' },
          error: null,
        })

        await signInWithGoogle()

        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: 'https://goodhealth-preview-xyz789.vercel.app/api/auth/callback',
          },
        })
      })

      it('should use VERCEL_URL when headers are not available', async () => {
        delete process.env.APP_URL
        delete process.env.NEXT_PUBLIC_APP_URL
        process.env.VERCEL_URL = 'goodhealth-preview-def456.vercel.app'

        mockHeaders.get.mockReturnValue(null)

        mockSupabase.auth.signInWithOAuth.mockResolvedValue({
          data: { url: 'https://accounts.google.com/oauth' },
          error: null,
        })

        await signInWithGoogle()

        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: 'https://goodhealth-preview-def456.vercel.app/api/auth/callback',
          },
        })
      })

      it('should fallback to localhost when no URL sources are available', async () => {
        delete process.env.APP_URL
        delete process.env.NEXT_PUBLIC_APP_URL
        delete process.env.VERCEL_URL

        mockHeaders.get.mockReturnValue(null)

        mockSupabase.auth.signInWithOAuth.mockResolvedValue({
          data: { url: 'https://accounts.google.com/oauth' },
          error: null,
        })

        await signInWithGoogle()

        expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: 'http://localhost:3000/api/auth/callback',
          },
        })
      })
    })

    describe('signUp - URL priority', () => {
      it('should prioritize origin header for preview deployments', async () => {
        process.env.APP_URL = 'https://goodhealth-production.vercel.app'

        mockHeaders.get.mockImplementation((header: string) => {
          if (header === 'origin') return 'https://goodhealth-pr-123.vercel.app'
          return null
        })

        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: { id: '123' } },
          error: null,
        })

        const formData = new FormData()
        formData.append('email', 'test@example.com')
        formData.append('password', 'password123')
        formData.append('fullName', 'Test User')

        await signUp(formData)

        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
          expect.objectContaining({
            options: expect.objectContaining({
              emailRedirectTo: 'https://goodhealth-pr-123.vercel.app/api/auth/callback',
            }),
          })
        )
      })
    })

    describe('resetPassword - URL priority', () => {
      it('should prioritize origin header for preview deployments', async () => {
        process.env.APP_URL = 'https://goodhealth-production.vercel.app'

        mockHeaders.get.mockImplementation((header: string) => {
          if (header === 'origin') return 'https://goodhealth-pr-456.vercel.app'
          return null
        })

        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null,
        })

        const formData = new FormData()
        formData.append('email', 'test@example.com')

        await resetPassword(formData)

        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          {
            redirectTo: 'https://goodhealth-pr-456.vercel.app/auth/update-password',
          }
        )
      })
    })
  })
})
