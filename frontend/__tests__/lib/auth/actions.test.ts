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

// Test fixtures - not real credentials
const TEST_EMAIL = 'test@example.com'
const TEST_PASSWORD = 'password123' // sonarjs/no-hardcoded-passwords - this is a test fixture
const TEST_USER_NAME = 'Test User'
const TEST_APP_URL = 'https://goodhealth-three.vercel.app'

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
      process.env.APP_URL = TEST_APP_URL
      delete process.env.NEXT_PUBLIC_APP_URL

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', TEST_EMAIL)
      formData.append('password', TEST_PASSWORD)
      formData.append('fullName', TEST_USER_NAME)

      await signUp(formData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          emailRedirectTo: `${TEST_APP_URL}/api/auth/callback`,
          data: {
            full_name: TEST_USER_NAME,
          },
        },
      })
    })

    it('should fallback to NEXT_PUBLIC_APP_URL when APP_URL is not set', async () => {
      delete process.env.APP_URL
      process.env.NEXT_PUBLIC_APP_URL = TEST_APP_URL

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', TEST_EMAIL)
      formData.append('password', TEST_PASSWORD)
      formData.append('fullName', TEST_USER_NAME)

      await signUp(formData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          emailRedirectTo: `${TEST_APP_URL}/api/auth/callback`,
          data: {
            full_name: TEST_USER_NAME,
          },
        },
      })
    })

    it('should fallback to referer header when no env vars are set', async () => {
      delete process.env.APP_URL
      delete process.env.NEXT_PUBLIC_APP_URL
      const localUrl = 'http://localhost:3000'
      mockHeaders.get.mockImplementation((header: string) => {
        if (header === 'referer') return `${localUrl}/signup`
        return null
      })

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('email', TEST_EMAIL)
      formData.append('password', TEST_PASSWORD)
      formData.append('fullName', TEST_USER_NAME)

      await signUp(formData)

      expect(mockHeaders.get).toHaveBeenCalledWith('referer')
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          emailRedirectTo: `${localUrl}/api/auth/callback`,
          data: {
            full_name: TEST_USER_NAME,
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
    it('should use client-provided origin', async () => {
      const clientOrigin = 'https://goodhealth-preview-abc123.vercel.app'

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      })

      await signInWithGoogle(clientOrigin)

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://goodhealth-preview-abc123.vercel.app/api/auth/callback',
        },
      })
    })

    it('should work with production URL', async () => {
      const clientOrigin = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      })

      await signInWithGoogle(clientOrigin)

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://goodhealth-three.vercel.app/api/auth/callback',
        },
      })
    })

    it('should work with localhost', async () => {
      const clientOrigin = 'http://localhost:3000'

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      })

      await signInWithGoogle(clientOrigin)

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/api/auth/callback',
        },
      })
    })

    it('should redirect to OAuth URL when successful', async () => {
      const clientOrigin = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      })

      await signInWithGoogle(clientOrigin)

      expect(redirect).toHaveBeenCalledWith('https://accounts.google.com/oauth')
    })

    it('should return error when OAuth fails', async () => {
      const clientOrigin = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth provider not configured' },
      })

      const result = await signInWithGoogle(clientOrigin)

      expect(result).toEqual({ error: 'OAuth provider not configured' })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should not redirect if no URL is returned', async () => {
      const clientOrigin = 'https://goodhealth-three.vercel.app'

      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: null },
        error: null,
      })

      await signInWithGoogle(clientOrigin)

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

    it('should fallback to referer header when no env vars are set', async () => {
      delete process.env.APP_URL
      delete process.env.NEXT_PUBLIC_APP_URL
      mockHeaders.get.mockImplementation((header: string) => {
        if (header === 'referer') return 'http://localhost:3000/forgot-password'
        return null
      })

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      })

      const formData = new FormData()
      formData.append('email', 'test@example.com')

      await resetPassword(formData)

      expect(mockHeaders.get).toHaveBeenCalledWith('referer')
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

})
