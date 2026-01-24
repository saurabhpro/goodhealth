/**
 * Unit tests for workout-session integration
 * Tests the createWorkout action with session linking
 */

import { createWorkout } from '@/lib/workouts/actions'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncGoalProgress } from '@/lib/goals/sync'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))
jest.mock('@/lib/goals/sync', () => ({
  syncGoalProgress: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>
const mockSyncGoalProgress = syncGoalProgress as jest.MockedFunction<typeof syncGoalProgress>

interface MockSupabaseQuery {
  select?: jest.Mock
  eq?: jest.Mock
  single?: jest.Mock
  insert?: jest.Mock
  update?: jest.Mock
}

interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock
  }
  from: jest.Mock<MockSupabaseQuery, [string]>
}

describe('Workout-Session Integration', () => {
  let mockSupabase: MockSupabaseClient

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn() as jest.Mock<MockSupabaseQuery>,
    }

    mockCreateClient.mockResolvedValue(mockSupabase as never)
  })

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const createMockFormData = (sessionId?: string) => {
    const formData = new FormData()
    formData.append('name', 'Test Workout')
    formData.append('date', '2025-01-21')
    formData.append('duration', '60')
    formData.append('description', 'Test description')
    formData.append('effort_level', '3')
    formData.append('exercises', JSON.stringify([
      { name: 'Bench Press', type: 'strength', sets: '3', reps: '10', weight: '60' }
    ]))
    if (sessionId) {
      formData.append('session_id', sessionId)
    }
    return formData
  }

  describe('createWorkout without session', () => {
    it('should create workout without linking to session', async () => {
      const mockWorkout = {
        id: 'workout-1',
        user_id: mockUser.id,
        name: 'Test Workout',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockWorkout,
            error: null,
          }),
        }),
      })

      const mockFromWorkouts = jest.fn().mockReturnValue({
        insert: mockInsert,
      })

      const mockFromExercises = jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workouts') return mockFromWorkouts() as MockSupabaseQuery
        if (table === 'exercises') return mockFromExercises() as MockSupabaseQuery
        return {} as MockSupabaseQuery
      })

      const formData = createMockFormData()
      const result = await createWorkout(formData)

      expect(result.success).toBe(true)
      expect(result.workoutId).toBe('workout-1')
      expect(mockSyncGoalProgress).toHaveBeenCalledWith(mockUser.id)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/workouts')
      expect(mockRevalidatePath).not.toHaveBeenCalledWith('/workout-plans')
    })
  })

  describe('createWorkout with session', () => {
    it('should create workout and link to session', async () => {
      const sessionId = 'session-123'
      const mockWorkout = {
        id: 'workout-1',
        user_id: mockUser.id,
        name: 'Test Workout',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockWorkout,
            error: null,
          }),
        }),
      })

      const mockFromWorkouts = jest.fn().mockReturnValue({
        insert: mockInsert,
      })

      const mockFromExercises = jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      const mockFromSessions = jest.fn().mockReturnValue({
        update: mockUpdate,
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workouts') return mockFromWorkouts() as MockSupabaseQuery
        if (table === 'exercises') return mockFromExercises() as MockSupabaseQuery
        if (table === 'workout_plan_sessions') return mockFromSessions() as MockSupabaseQuery
        return {} as MockSupabaseQuery
      })

      const formData = createMockFormData(sessionId)
      const result = await createWorkout(formData)

      expect(result.success).toBe(true)
      expect(result.workoutId).toBe('workout-1')

      // Verify session was updated
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockRevalidatePath).toHaveBeenCalledWith('/workout-plans')
    })

    it('should update session status to completed', async () => {
      const sessionId = 'session-123'
      const mockWorkout = {
        id: 'workout-1',
        user_id: mockUser.id,
        name: 'Test Workout',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockEq,
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockWorkout,
            error: null,
          }),
        }),
      })

      const mockFromWorkouts = jest.fn().mockReturnValue({
        insert: mockInsert,
      })

      const mockFromExercises = jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      const mockFromSessions = jest.fn().mockReturnValue({
        update: mockUpdate,
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workouts') return mockFromWorkouts() as MockSupabaseQuery
        if (table === 'exercises') return mockFromExercises() as MockSupabaseQuery
        if (table === 'workout_plan_sessions') return mockFromSessions() as MockSupabaseQuery
        return {} as MockSupabaseQuery
      })

      const formData = createMockFormData(sessionId)
      await createWorkout(formData)

      // Verify update was called with correct status
      const updateCall = mockUpdate.mock.calls[0][0]
      expect(updateCall).toMatchObject({
        status: 'completed',
        completed_workout_id: 'workout-1',
      })
      expect(updateCall.completed_at).toBeDefined()

      // Verify eq was called with session ID
      expect(mockEq).toHaveBeenCalledWith('id', sessionId)
    })

    it('should not fail workout creation if session update fails', async () => {
      const sessionId = 'session-123'
      const mockWorkout = {
        id: 'workout-1',
        user_id: mockUser.id,
        name: 'Test Workout',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Session update failed' },
        }),
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockWorkout,
            error: null,
          }),
        }),
      })

      const mockFromWorkouts = jest.fn().mockReturnValue({
        insert: mockInsert,
      })

      const mockFromExercises = jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      const mockFromSessions = jest.fn().mockReturnValue({
        update: mockUpdate,
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workouts') return mockFromWorkouts() as MockSupabaseQuery
        if (table === 'exercises') return mockFromExercises() as MockSupabaseQuery
        if (table === 'workout_plan_sessions') return mockFromSessions() as MockSupabaseQuery
        return {} as MockSupabaseQuery
      })

      const formData = createMockFormData(sessionId)
      const result = await createWorkout(formData)

      // Workout should still succeed
      expect(result.success).toBe(true)
      expect(result.workoutId).toBe('workout-1')
    })
  })

  describe('error handling', () => {
    it('should return error if user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = createMockFormData()
      const result = await createWorkout(formData)

      expect(result.error).toBe('Not authenticated')
      expect(result.success).toBeUndefined()
    })

    it('should handle workout creation failure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as MockSupabaseQuery)

      const formData = createMockFormData()
      const result = await createWorkout(formData)

      expect(result.error).toContain('Failed to create workout')
      expect(mockSyncGoalProgress).not.toHaveBeenCalled()
    })
  })
})
