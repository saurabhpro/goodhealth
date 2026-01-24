/**
 * Unit tests for workout plan CRUD operations
 */

import {
  createWorkoutPlan,
  getWorkoutPlans,
  getWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  activateWorkoutPlan,
  completeWorkoutPlan,
} from '@/lib/workout-plans/actions'
import { createClient } from '@/lib/supabase/server'
import type { InsertWorkoutPlan, UpdateWorkoutPlan } from '@/types'

// Mock Next.js cache revalidation
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Workout Plan Actions', () => {
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

  describe('createWorkoutPlan', () => {
    it('should create a workout plan successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockPlan = {
        id: 'plan-123',
        user_id: 'user-123',
        name: 'My Fitness Plan',
        goal_type: 'muscle_building' as const,
        weeks_duration: 8,
        workouts_per_week: 4,
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockPlan,
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      })

      const planData: Omit<InsertWorkoutPlan, 'user_id'> = {
        name: 'My Fitness Plan',
        goal_type: 'muscle_building',
        weeks_duration: 8,
        workouts_per_week: 4,
      }

      const result = await createWorkoutPlan(planData)

      expect(result.success).toBe(true)
      expect(result.plan).toEqual(mockPlan)
      expect(mockInsert).toHaveBeenCalledWith({
        ...planData,
        user_id: 'user-123',
      })
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const planData: Omit<InsertWorkoutPlan, 'user_id'> = {
        name: 'My Plan',
        goal_type: 'weight_loss',
      }

      const result = await createWorkoutPlan(planData)

      expect(result.error).toBe('Not authenticated')
    })

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      })

      const planData: Omit<InsertWorkoutPlan, 'user_id'> = {
        name: 'My Plan',
        goal_type: 'endurance',
      }

      const result = await createWorkoutPlan(planData)

      expect(result.error).toContain('Failed to create workout plan')
    })
  })

  describe('getWorkoutPlans', () => {
    it('should fetch all workout plans for authenticated user', async () => {
      const mockUser = { id: 'user-123' }
      const mockPlans = [
        { id: 'plan-1', name: 'Plan 1', user_id: 'user-123' },
        { id: 'plan-2', name: 'Plan 2', user_id: 'user-123' },
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockPlans,
                error: null,
              }),
            }),
          }),
        }),
      })

      const result = await getWorkoutPlans()

      expect(result.plans).toEqual(mockPlans)
      expect(result.plans).toHaveLength(2)
    })

    it('should return empty array when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await getWorkoutPlans()

      expect(result.plans).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      })

      const result = await getWorkoutPlans()

      expect(result.plans).toEqual([])
      expect(result.error).toBe('Database error')
    })
  })

  describe('getWorkoutPlan', () => {
    it('should fetch a single workout plan with sessions', async () => {
      const mockUser = { id: 'user-123' }
      const mockPlan = {
        id: 'plan-123',
        name: 'My Plan',
        user_id: 'user-123',
        workout_plan_sessions: [
          { id: 'session-1', week_number: 1, day_of_week: 1 },
        ],
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockPlan,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      const result = await getWorkoutPlan('plan-123')

      expect(result.plan).toEqual(mockPlan)
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await getWorkoutPlan('plan-123')

      expect(result.error).toBe('Not authenticated')
    })

    it('should return error when plan is not found', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              }),
            }),
          }),
        }),
      })

      const result = await getWorkoutPlan('nonexistent-plan')

      expect(result.error).toContain('Failed to fetch workout plan')
    })
  })

  describe('updateWorkoutPlan', () => {
    it('should update a workout plan successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockUpdatedPlan = {
        id: 'plan-123',
        name: 'Updated Plan Name',
        user_id: 'user-123',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockUpdatedPlan,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      const updateData: UpdateWorkoutPlan = {
        name: 'Updated Plan Name',
      }

      const result = await updateWorkoutPlan('plan-123', updateData)

      expect(result.success).toBe(true)
      expect(result.plan).toEqual(mockUpdatedPlan)
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await updateWorkoutPlan('plan-123', { name: 'New Name' })

      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('deleteWorkoutPlan', () => {
    it('should delete a workout plan successfully', async () => {
      const mockUser = { id: 'user-123' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockUpdate = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockResolvedValue({
                error: null,
              }),
            }),
          }),
      })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      })

      const result = await deleteWorkoutPlan('plan-123')

      expect(result.success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith({
        deleted_at: expect.any(String),
        status: 'archived',
        updated_at: expect.any(String),
      })
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await deleteWorkoutPlan('plan-123')

      expect(result.error).toBe('Not authenticated')
    })

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockResolvedValue({
                error: { message: 'Delete failed' },
              }),
            }),
          }),
        }),
      })

      const result = await deleteWorkoutPlan('plan-123')

      expect(result.error).toBe('Delete failed')
    })
  })

  describe('activateWorkoutPlan', () => {
    it('should activate a workout plan successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockActivatedPlan = {
        id: 'plan-123',
        status: 'active',
        user_id: 'user-123',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // Mock check for existing active plans
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plans') {
          const selectMock = jest.fn()
          selectMock.mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                is: jest.fn().mockResolvedValue({
                  data: [], // No active plans
                  error: null,
                }),
              }),
            }),
          })

          const updateMock = jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockActivatedPlan,
                    error: null,
                  }),
                }),
              }),
            }),
          })

          return {
            select: selectMock,
            update: updateMock,
          }
        }
      })

      const result = await activateWorkoutPlan('plan-123')

      expect(result.success).toBe(true)
      expect(result.plan).toEqual(mockActivatedPlan)
    })

    it('should return error when another plan is already active', async () => {
      const mockUser = { id: 'user-123' }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockResolvedValue({
                data: [{ id: 'other-plan' }], // Another plan is active
                error: null,
              }),
            }),
          }),
        }),
      })

      const result = await activateWorkoutPlan('plan-123')

      expect(result.error).toContain('already have an active plan')
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await activateWorkoutPlan('plan-123')

      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('completeWorkoutPlan', () => {
    it('should complete a workout plan successfully', async () => {
      const mockUser = { id: 'user-123' }
      const mockCompletedPlan = {
        id: 'plan-123',
        status: 'completed',
        user_id: 'user-123',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockCompletedPlan,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      })

      const result = await completeWorkoutPlan('plan-123')

      expect(result.success).toBe(true)
      expect(result.plan).toEqual(mockCompletedPlan)
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await completeWorkoutPlan('plan-123')

      expect(result.error).toBe('Not authenticated')
    })

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Update failed' },
                }),
              }),
            }),
          }),
        }),
      })

      const result = await completeWorkoutPlan('plan-123')

      expect(result.error).toContain('Failed to complete workout plan')
    })
  })
})
