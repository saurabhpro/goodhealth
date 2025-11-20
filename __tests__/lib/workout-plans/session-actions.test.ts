/**
 * Unit tests for workout plan session CRUD operations
 */

import {
  createPlanSession,
  getWeekSessions,
  updatePlanSession,
  completePlanSession,
  skipPlanSession,
  deletePlanSession,
  getPlanStats,
} from '@/lib/workout-plans/session-actions'
import { createClient } from '@/lib/supabase/server'
import type { InsertWorkoutPlanSession, UpdateWorkoutPlanSession } from '@/types'

// Mock Next.js cache revalidation
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Workout Plan Session Actions', () => {
  let mockSupabase: ReturnType<typeof createClient>

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    }

    mockCreateClient.mockResolvedValue(mockSupabase)
  })

  describe('createPlanSession', () => {
    it('should create a plan session successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockSession = {
        id: 'session-123',
        plan_id: 'plan-123',
        week_number: 1,
        day_of_week: 1,
        workout_name: 'Upper Body',
        workout_type: 'strength' as const,
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock plan verification
      const planVerifyMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'plan-123' },
              error: null,
            }),
          }),
        }),
      })

      // Mock session insert
      const sessionInsertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSession,
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plans') {
          return { select: planVerifyMock }
        }
        if (table === 'workout_plan_sessions') {
          return { insert: sessionInsertMock }
        }
      })

      const sessionData: InsertWorkoutPlanSession = {
        plan_id: 'plan-123',
        week_number: 1,
        day_of_week: 1,
        day_name: 'Monday',
        workout_name: 'Upper Body',
        workout_type: 'strength',
      }

      const result = await createPlanSession(sessionData)

      expect(result.success).toBe(true)
      expect(result.session).toEqual(mockSession)
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const sessionData: InsertWorkoutPlanSession = {
        plan_id: 'plan-123',
        week_number: 1,
        day_of_week: 1,
        day_name: 'Monday',
        workout_name: 'Test',
        workout_type: 'strength',
      }

      const result = await createPlanSession(sessionData)

      expect(result.error).toBe('Not authenticated')
    })

    it('should return error when plan does not belong to user', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null, // Plan not found
                error: null,
              }),
            }),
          }),
        }),
      })

      const sessionData: InsertWorkoutPlanSession = {
        plan_id: 'wrong-plan',
        week_number: 1,
        day_of_week: 1,
        day_name: 'Monday',
        workout_name: 'Test',
        workout_type: 'strength',
      }

      const result = await createPlanSession(sessionData)

      expect(result.error).toBe('Plan not found or access denied')
    })
  })

  describe('getWeekSessions', () => {
    it('should fetch sessions for a specific week', async () => {
      const mockUser = { id: 'user-123' }
      const mockSessions = [
        { id: 'session-1', week_number: 1, day_of_week: 1, workout_name: 'Upper Body' },
        { id: 'session-2', week_number: 1, day_of_week: 3, workout_name: 'Lower Body' },
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock plan verification
      const planVerifyMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'plan-123' },
              error: null,
            }),
          }),
        }),
      })

      // Mock sessions fetch
      const sessionsSelectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockSessions,
                error: null,
              }),
            }),
          }),
        }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plans') {
          return { select: planVerifyMock }
        }
        if (table === 'workout_plan_sessions') {
          return { select: sessionsSelectMock }
        }
      })

      const result = await getWeekSessions('plan-123', 1)

      expect(result.sessions).toEqual(mockSessions)
      expect(result.sessions).toHaveLength(2)
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await getWeekSessions('plan-123', 1)

      expect(result.error).toBe('Not authenticated')
    })

    it('should return empty array when no sessions found', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plans') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'plan-123' },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'workout_plan_sessions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
      })

      const result = await getWeekSessions('plan-123', 5)

      expect(result.sessions).toEqual([])
    })
  })

  describe('updatePlanSession', () => {
    it('should update a plan session successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockUpdatedSession = {
        id: 'session-123',
        workout_name: 'Updated Workout',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock session verification
      const sessionVerifyMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              plan_id: 'plan-123',
              workout_plans: { user_id: 'user-123' },
            },
            error: null,
          }),
        }),
      })

      // Mock session update
      const sessionUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUpdatedSession,
              error: null,
            }),
          }),
        }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plan_sessions') {
          return {
            select: sessionVerifyMock,
            update: sessionUpdateMock,
          }
        }
      })

      const updateData: UpdateWorkoutPlanSession = {
        workout_name: 'Updated Workout',
      }

      const result = await updatePlanSession('session-123', updateData)

      expect(result.success).toBe(true)
      expect(result.session).toEqual(mockUpdatedSession)
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await updatePlanSession('session-123', { workout_name: 'Test' })

      expect(result.error).toBe('Not authenticated')
    })

    it('should return error when session does not belong to user', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                plan_id: 'plan-123',
                workout_plans: { user_id: 'other-user' }, // Different user
              },
              error: null,
            }),
          }),
        }),
      })

      const result = await updatePlanSession('session-123', { workout_name: 'Test' })

      expect(result.error).toBe('Session not found or access denied')
    })
  })

  describe('completePlanSession', () => {
    it('should complete a plan session successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockCompletedSession = {
        id: 'session-123',
        status: 'completed',
        completed_workout_id: 'workout-123',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock session verification
      const sessionVerifyMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              plan_id: 'plan-123',
              workout_plans: { user_id: 'user-123' },
            },
            error: null,
          }),
        }),
      })

      // Mock session update
      const sessionUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCompletedSession,
              error: null,
            }),
          }),
        }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plan_sessions') {
          return {
            select: sessionVerifyMock,
            update: sessionUpdateMock,
          }
        }
      })

      const result = await completePlanSession('session-123', 'workout-123', 'Great workout!')

      expect(result.success).toBe(true)
      expect(result.session).toEqual(mockCompletedSession)
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await completePlanSession('session-123', 'workout-123')

      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('skipPlanSession', () => {
    it('should skip a plan session successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockSkippedSession = {
        id: 'session-123',
        status: 'skipped',
        notes: 'Felt tired',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock session verification
      const sessionVerifyMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              plan_id: 'plan-123',
              workout_plans: { user_id: 'user-123' },
            },
            error: null,
          }),
        }),
      })

      // Mock session update
      const sessionUpdateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSkippedSession,
              error: null,
            }),
          }),
        }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plan_sessions') {
          return {
            select: sessionVerifyMock,
            update: sessionUpdateMock,
          }
        }
      })

      const result = await skipPlanSession('session-123', 'Felt tired')

      expect(result.success).toBe(true)
      expect(result.session).toEqual(mockSkippedSession)
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await skipPlanSession('session-123')

      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('deletePlanSession', () => {
    it('should delete a plan session successfully', async () => {
      const mockUser = { id: 'user-123' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock session verification
      const sessionVerifyMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              plan_id: 'plan-123',
              workout_plans: { user_id: 'user-123' },
            },
            error: null,
          }),
        }),
      })

      // Mock session delete
      const sessionDeleteMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plan_sessions') {
          return {
            select: sessionVerifyMock,
            delete: sessionDeleteMock,
          }
        }
      })

      const result = await deletePlanSession('session-123')

      expect(result.success).toBe(true)
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await deletePlanSession('session-123')

      expect(result.error).toBe('Not authenticated')
    })

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock session verification
      const sessionVerifyMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              plan_id: 'plan-123',
              workout_plans: { user_id: 'user-123' },
            },
            error: null,
          }),
        }),
      })

      // Mock session delete with error
      const sessionDeleteMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Delete failed' },
        }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plan_sessions') {
          return {
            select: sessionVerifyMock,
            delete: sessionDeleteMock,
          }
        }
      })

      const result = await deletePlanSession('session-123')

      expect(result.error).toBe('Delete failed')
    })
  })

  describe('getPlanStats', () => {
    it('should calculate plan statistics correctly', async () => {
      const mockUser = { id: 'user-123' }
      const mockSessions = [
        { status: 'completed', workout_type: 'strength' },
        { status: 'completed', workout_type: 'cardio' },
        { status: 'skipped', workout_type: 'strength' },
        { status: 'scheduled', workout_type: 'cardio' },
        { status: 'scheduled', workout_type: 'rest' }, // Should be excluded from adherence
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock plan verification
      const planVerifyMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'plan-123' },
              error: null,
            }),
          }),
        }),
      })

      // Mock sessions fetch
      const sessionsSelectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockSessions,
          error: null,
        }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plans') {
          return { select: planVerifyMock }
        }
        if (table === 'workout_plan_sessions') {
          return { select: sessionsSelectMock }
        }
      })

      const result = await getPlanStats('plan-123')

      expect(result.stats).toBeDefined()
      expect(result.stats?.totalSessions).toBe(5)
      expect(result.stats?.completedSessions).toBe(2)
      expect(result.stats?.skippedSessions).toBe(1)
      expect(result.stats?.scheduledSessions).toBe(2)
      // Adherence: 2 completed / (5 total - 1 rest) = 2/4 = 50%
      expect(result.stats?.adherenceRate).toBe(50)
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await getPlanStats('plan-123')

      expect(result.error).toBe('Not authenticated')
    })

    it('should handle empty sessions list', async () => {
      const mockUser = { id: 'user-123' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plans') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'plan-123' },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'workout_plan_sessions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }
        }
      })

      const result = await getPlanStats('plan-123')

      expect(result.stats).toBeDefined()
      expect(result.stats?.totalSessions).toBe(0)
      expect(result.stats?.adherenceRate).toBe(0)
    })

    it('should return error when plan does not belong to user', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null, // Plan not found
                error: null,
              }),
            }),
          }),
        }),
      })

      const result = await getPlanStats('wrong-plan')

      expect(result.error).toBe('Plan not found or access denied')
    })
  })
})
