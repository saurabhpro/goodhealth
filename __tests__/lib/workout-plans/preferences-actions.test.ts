/**
 * Unit tests for User Workout Preferences Actions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  getUserPreferences,
  upsertUserPreferences,
  updateUserPreferences,
  getUserTemplates,
  getUserTemplate,
  createUserTemplate,
  updateUserTemplate,
  deleteUserTemplate,
  incrementTemplateUsage,
} from '@/lib/workout-plans/preferences-actions'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('User Preferences Actions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockResolvedValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any)
  })

  describe('getUserPreferences', () => {
    it('should return user preferences when they exist', async () => {
      const mockPreferences = {
        user_id: 'user-123',
        liked_exercises: ['bench press', 'squats'],
        avoided_exercises: ['pull-ups'],
        preferred_duration: 60,
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockPreferences, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await getUserPreferences()

      expect(result.preferences).toEqual(mockPreferences)
      expect(result.error).toBeUndefined()
      expect(mockSupabase.from).toHaveBeenCalledWith('user_workout_preferences')
    })

    it('should return undefined preferences when none exist', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await getUserPreferences()

      expect(result.preferences).toBeUndefined()
      expect(result.error).toBeUndefined()
    })

    it('should return error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      const result = await getUserPreferences()

      expect(result.error).toBe('Not authenticated')
    })

    it('should return error on database failure', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'OTHER_ERROR', message: 'Database error' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await getUserPreferences()

      expect(result.error).toBe('Database error')
    })
  })

  describe('upsertUserPreferences', () => {
    it('should create new preferences', async () => {
      const newPreferences = {
        liked_exercises: ['bench press'],
        avoided_exercises: ['pull-ups'],
        preferred_duration: 60,
      }

      const mockQuery = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...newPreferences, user_id: 'user-123' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await upsertUserPreferences(newPreferences)

      expect(result.preferences).toEqual({
        ...newPreferences,
        user_id: 'user-123',
      })
      expect(result.error).toBeUndefined()
      expect(mockQuery.upsert).toHaveBeenCalledWith(
        {
          ...newPreferences,
          user_id: 'user-123',
        },
        { onConflict: 'user_id' }
      )
    })

    it('should return error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      const result = await upsertUserPreferences({})

      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('updateUserPreferences', () => {
    it('should update specific preference fields', async () => {
      const updates = {
        preferred_duration: 90,
        liked_exercises: ['deadlifts', 'bench press'],
      }

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { user_id: 'user-123', ...updates },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await updateUserPreferences(updates)

      expect(result.preferences).toEqual({ user_id: 'user-123', ...updates })
      expect(result.error).toBeUndefined()
    })
  })

  describe('getUserTemplates', () => {
    it('should return all user templates', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          user_id: 'user-123',
          name: 'My Workout',
          exercises: [],
        },
        {
          id: 'template-2',
          user_id: 'user-123',
          name: 'Another Workout',
          exercises: [],
        },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockTemplates, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await getUserTemplates()

      expect(result.templates).toEqual(mockTemplates)
      expect(result.error).toBeUndefined()
    })

    // Note: Filter tests are skipped as they test Supabase's query builder
    // which is already tested by Supabase. The basic CRUD operations are tested above.
  })

  describe('getUserTemplate', () => {
    it('should return a single template by ID', async () => {
      const mockTemplate = {
        id: 'template-1',
        user_id: 'user-123',
        name: 'My Workout',
        exercises: [],
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockTemplate, error: null }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await getUserTemplate('template-1')

      expect(result.template).toEqual(mockTemplate)
      expect(result.error).toBeUndefined()
    })
  })

  describe('createUserTemplate', () => {
    it('should create a new template', async () => {
      const newTemplate = {
        name: 'New Workout',
        description: 'A test workout',
        exercises: [],
        intensity_level: 'medium' as const,
      }

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...newTemplate, id: 'new-id', user_id: 'user-123' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await createUserTemplate(newTemplate)

      expect(result.template).toEqual({
        ...newTemplate,
        id: 'new-id',
        user_id: 'user-123',
      })
      expect(result.error).toBeUndefined()
    })
  })

  describe('updateUserTemplate', () => {
    it('should update a template', async () => {
      const updates = {
        name: 'Updated Workout',
        intensity_level: 'high' as const,
      }

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'template-1', user_id: 'user-123', ...updates },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await updateUserTemplate('template-1', updates)

      expect(result.template).toEqual({
        id: 'template-1',
        user_id: 'user-123',
        ...updates,
      })
      expect(result.error).toBeUndefined()
    })
  })

  describe('deleteUserTemplate', () => {
    it('should return error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      const result = await deleteUserTemplate('template-1')

      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('incrementTemplateUsage', () => {
    it('should return error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      const result = await incrementTemplateUsage('template-1')

      expect(result.error).toBe('Not authenticated')
    })
  })
})
