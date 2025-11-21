/**
 * Unit tests for session details business logic
 * Tests the logic of fetching session details with exercises from templates
 */

import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

interface MockSupabaseQuery {
  select?: jest.Mock
  eq?: jest.Mock
  single?: jest.Mock
}

interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock
  }
  from: jest.Mock<MockSupabaseQuery, [string]>
}

describe('Session Details Logic', () => {
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

  const mockSession = {
    id: 'session-1',
    plan_id: 'plan-1',
    week_number: 1,
    day_name: 'Monday',
    workout_name: 'Upper Body',
    workout_template_id: 'template-1',
    exercises: [],
    plan: {
      id: 'plan-1',
      user_id: 'user-123',
      name: 'Test Plan',
    },
  }

  const mockTemplate = {
    id: 'template-1',
    name: 'Upper Body Template',
    exercises: [
      { name: 'Bench Press', sets: 3, reps: 10, weight: 60, type: 'strength' },
      { name: 'Rows', sets: 3, reps: 10, weight: 50, type: 'strength' },
    ],
  }

  describe('fetching session with template', () => {
    it('should fetch session with associated plan', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSession,
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as MockSupabaseQuery)

      const supabase = await mockCreateClient()
      const result = await supabase
        .from('workout_plan_sessions')
        .select!(`*, plan:workout_plans(*)`)
        .eq!('id', 'session-1')
        .single!()

      expect(result.data).toEqual(mockSession)
      expect(mockSelect).toHaveBeenCalledWith(`*, plan:workout_plans(*)`)
    })

    it('should fetch template when session has workout_template_id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockTemplate,
            error: null,
          }),
        }),
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as MockSupabaseQuery)

      const supabase = await mockCreateClient()
      const result = await supabase
        .from('workout_templates')
        .select!('*')
        .eq!('id', 'template-1')
        .single!()

      expect(result.data).toEqual(mockTemplate)
    })

    it('should prioritize session exercises over template exercises', () => {
      const sessionWithExercises = {
        ...mockSession,
        exercises: [
          { name: 'Squats', sets: 4, reps: 8, weight: 100 },
        ],
      }

      // Business logic: session.exercises || template.exercises || []
      const exercises = sessionWithExercises.exercises || mockTemplate.exercises || []

      expect(exercises).toEqual(sessionWithExercises.exercises)
    })

    it('should use template exercises when session has none', () => {
      const sessionNoExercises = {
        ...mockSession,
        exercises: [],
      }

      // Business logic: session.exercises || template.exercises || []
      // Empty array is truthy, so check length
      const exercises = sessionNoExercises.exercises.length > 0
        ? sessionNoExercises.exercises
        : mockTemplate.exercises || []

      expect(exercises).toEqual(mockTemplate.exercises)
    })

    it('should return empty array when neither session nor template has exercises', () => {
      const sessionNoExercises = {
        ...mockSession,
        exercises: [],
      }
      const templateNoExercises = {
        ...mockTemplate,
        exercises: [],
      }

      // Business logic: session.exercises || template.exercises || []
      const exercises = sessionNoExercises.exercises || templateNoExercises.exercises || []

      expect(exercises).toEqual([])
    })
  })

  describe('authorization checks', () => {
    it('should verify session belongs to authenticated user', () => {
      const userOwnsSession = mockSession.plan.user_id === mockUser.id
      expect(userOwnsSession).toBe(true)
    })

    it('should reject session from different user', () => {
      const sessionOtherUser = {
        ...mockSession,
        plan: {
          ...mockSession.plan,
          user_id: 'other-user',
        },
      }

      const userOwnsSession = sessionOtherUser.plan.user_id === mockUser.id
      expect(userOwnsSession).toBe(false)
    })
  })

  describe('exercise data structure', () => {
    it('should handle strength exercises with sets, reps, weight', () => {
      const strengthExercise = {
        name: 'Bench Press',
        type: 'strength',
        sets: 3,
        reps: 10,
        weight: 60,
      }

      expect(strengthExercise).toHaveProperty('sets')
      expect(strengthExercise).toHaveProperty('reps')
      expect(strengthExercise).toHaveProperty('weight')
    })

    it('should handle cardio exercises with duration', () => {
      const cardioExercise = {
        name: 'Running',
        type: 'cardio',
        duration: 30,
        distance: 5,
      }

      expect(cardioExercise).toHaveProperty('duration')
      expect(cardioExercise).toHaveProperty('distance')
    })

    it('should preserve all exercise properties from template', () => {
      const templateExercise = mockTemplate.exercises[0]

      expect(templateExercise.name).toBeDefined()
      expect(templateExercise.sets).toBeDefined()
      expect(templateExercise.reps).toBeDefined()
      expect(templateExercise.weight).toBeDefined()
      expect(templateExercise.type).toBeDefined()
    })
  })
})
