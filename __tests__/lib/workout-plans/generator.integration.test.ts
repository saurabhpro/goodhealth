/**
 * Integration tests for workout plan generator
 * Tests the complete flow from goal to generated plan
 */

import { generateWorkoutPlan } from '@/lib/workout-plans/generator'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock Next.js cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Define mock types for Supabase client
interface MockSupabaseQuery {
  select?: jest.Mock
  eq?: jest.Mock
  single?: jest.Mock
  gte?: jest.Mock
  order?: jest.Mock
  insert?: jest.Mock
}

interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock
  }
  from: jest.Mock<MockSupabaseQuery, [string]>
}

describe('Workout Plan Generator - Integration', () => {
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

  const mockGoal = {
    id: 'goal-1',
    user_id: 'user-1',
    title: 'Lose 10kg',
    description: 'Weight loss goal',
    target_value: 70,
    current_value: 80,
    initial_value: 80,
    unit: 'kg',
    target_date: null,
    achieved: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockTemplates = [
    {
      id: 'template-1',
      user_id: 'user-1',
      name: 'HIIT Cardio',
      description: 'High intensity cardio',
      estimated_duration: 30,
      exercises: [
        { exercise_type: 'cardio', name: 'Running', duration: 1800, sets: null, reps: null, weight: null }
      ],
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'template-2',
      user_id: 'user-1',
      name: 'Upper Body Strength',
      description: 'Upper body workout',
      estimated_duration: 60,
      exercises: [
        { exercise_type: 'strength', name: 'Bench Press', sets: 3, reps: 10, weight: 60, weight_unit: 'kg' },
        { exercise_type: 'strength', name: 'Rows', sets: 3, reps: 12, weight: 50, weight_unit: 'kg' },
      ],
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'template-3',
      user_id: 'user-1',
      name: 'Lower Body Strength',
      description: 'Lower body workout',
      estimated_duration: 60,
      exercises: [
        { exercise_type: 'strength', name: 'Squats', sets: 4, reps: 8, weight: 80, weight_unit: 'kg' },
        { exercise_type: 'strength', name: 'Deadlifts', sets: 3, reps: 8, weight: 100, weight_unit: 'kg' },
      ],
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  it('should generate a complete workout plan', async () => {
    // Mock auth
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    })

    // Mock goal fetch with two .eq() calls
    const goalSingle = jest.fn().mockResolvedValue({ data: mockGoal, error: null })
    const goalEq2 = jest.fn().mockReturnValue({ single: goalSingle })
    const goalEq1 = jest.fn().mockReturnValue({ eq: goalEq2 })
    const goalSelect = jest.fn().mockReturnValue({ eq: goalEq1 })

    // Mock templates fetch with .select().or()
    const templateOr = jest.fn().mockResolvedValue({ data: mockTemplates, error: null })
    const templateSelect = jest.fn().mockReturnValue({ or: templateOr })

    // Mock workouts fetch with chaining
    const workoutLimit = jest.fn().mockResolvedValue({ data: [], error: null })
    const workoutOrder = jest.fn().mockReturnValue({ limit: workoutLimit })
    const workoutEq = jest.fn().mockReturnValue({ order: workoutOrder })
    const workoutSelect = jest.fn().mockReturnValue({ eq: workoutEq })

    // Mock plan insert with .insert().select().single()
    const planSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'plan-1',
        user_id: 'user-1',
        name: 'Weight Loss Plan',
        description: 'Test plan',
        goal_id: 'goal-1',
        goal_type: 'weight_loss',
        weeks_duration: 4,
        workouts_per_week: 5,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    })
    const planSelect = jest.fn().mockReturnValue({ single: planSingle })
    const planInsert = jest.fn().mockReturnValue({ select: planSelect })

    // Mock sessions insert
    const sessionsInsert = jest.fn().mockReturnThis()
    sessionsInsert.select = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    })

    // Mock sessions fetch
    const sessionsSelect = jest.fn().mockReturnThis()
    sessionsSelect.eq = jest.fn().mockReturnThis()
    sessionsSelect.order = jest.fn().mockReturnThis()
    sessionsSelect.order = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    })

    // Set up from() mock to return appropriate objects
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'goals') {
        return { select: goalSelect }
      }
      if (table === 'workout_templates') {
        return { select: templateSelect }
      }
      if (table === 'workouts') {
        return { select: workoutSelect }
      }
      if (table === 'workout_plans') {
        return { insert: planInsert }
      }
      if (table === 'workout_plan_sessions') {
        return {
          insert: sessionsInsert,
          select: sessionsSelect,
        }
      }
      return { select: jest.fn().mockReturnThis() }
    })

    const result = await generateWorkoutPlan({
      goalId: 'goal-1',
      weeksCount: 4,
      workoutsPerWeek: 5,
    })

    expect(result.success).toBe(true)
    expect(result.planId).toBe('plan-1')
    expect(result.plan).toBeDefined()
    expect(result.summary).toBeDefined()
    expect(result.summary?.totalWorkouts).toBeGreaterThan(0)
  })

  it('should return error when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const result = await generateWorkoutPlan({
      goalId: 'goal-1',
      weeksCount: 4,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should return error when goal is not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const goalSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Goal not found' },
    })
    const goalEq2 = jest.fn().mockReturnValue({ single: goalSingle })
    const goalEq1 = jest.fn().mockReturnValue({ eq: goalEq2 })
    const goalSelect = jest.fn().mockReturnValue({ eq: goalEq1 })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'goals') {
        return { select: goalSelect }
      }
      return { select: jest.fn().mockReturnThis() }
    })

    const result = await generateWorkoutPlan({
      goalId: 'invalid-goal',
      weeksCount: 4,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Goal not found')
  })

  it('should return error when no templates are available', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const goalSingle = jest.fn().mockResolvedValue({ data: mockGoal, error: null })
    const goalEq2 = jest.fn().mockReturnValue({ single: goalSingle })
    const goalEq1 = jest.fn().mockReturnValue({ eq: goalEq2 })
    const goalSelect = jest.fn().mockReturnValue({ eq: goalEq1 })

    const templateOr = jest.fn().mockResolvedValue({ data: [], error: null })
    const templateSelect = jest.fn().mockReturnValue({ or: templateOr })

    const workoutLimit = jest.fn().mockResolvedValue({ data: [], error: null })
    const workoutOrder = jest.fn().mockReturnValue({ limit: workoutLimit })
    const workoutEq = jest.fn().mockReturnValue({ order: workoutOrder })
    const workoutSelect = jest.fn().mockReturnValue({ eq: workoutEq })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'goals') {
        return { select: goalSelect }
      }
      if (table === 'workout_templates') {
        return { select: templateSelect }
      }
      if (table === 'workouts') {
        return { select: workoutSelect }
      }
      return { select: jest.fn().mockReturnThis() }
    })

    const result = await generateWorkoutPlan({
      goalId: 'goal-1',
      weeksCount: 4,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('templates')
  })

  it('should validate weeks count parameter', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    // Test with invalid weeks count (0)
    const result1 = await generateWorkoutPlan({
      goalId: 'goal-1',
      weeksCount: 0,
    })
    expect(result1.success).toBe(false)

    // Test with invalid weeks count (> 12)
    const result2 = await generateWorkoutPlan({
      goalId: 'goal-1',
      weeksCount: 15,
    })
    expect(result2.success).toBe(false)
  })

  it('should use custom workouts per week when provided', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const goalSingle = jest.fn().mockResolvedValue({ data: mockGoal, error: null })
    const goalEq2 = jest.fn().mockReturnValue({ single: goalSingle })
    const goalEq1 = jest.fn().mockReturnValue({ eq: goalEq2 })
    const goalSelect = jest.fn().mockReturnValue({ eq: goalEq1 })

    const templateOr = jest.fn().mockResolvedValue({ data: mockTemplates, error: null })
    const templateSelect = jest.fn().mockReturnValue({ or: templateOr })

    const workoutLimit = jest.fn().mockResolvedValue({ data: [], error: null })
    const workoutOrder = jest.fn().mockReturnValue({ limit: workoutLimit })
    const workoutEq = jest.fn().mockReturnValue({ order: workoutOrder })
    const workoutSelect = jest.fn().mockReturnValue({ eq: workoutEq })

    const planSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'plan-1',
        user_id: 'user-1',
        name: 'Test Plan',
        workouts_per_week: 3, // Custom value
        weeks_duration: 4,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    })
    const planSelect = jest.fn().mockReturnValue({ single: planSingle })
    const planInsert = jest.fn().mockReturnValue({ select: planSelect })

    const sessionsInsert = jest.fn().mockResolvedValue({ data: null, error: null })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'goals') return { select: goalSelect }
      if (table === 'workout_templates') return { select: templateSelect }
      if (table === 'workouts') return { select: workoutSelect }
      if (table === 'workout_plans') return { insert: planInsert }
      if (table === 'workout_plan_sessions') return { insert: sessionsInsert }
      return { select: jest.fn().mockReturnThis() }
    })

    const result = await generateWorkoutPlan({
      goalId: 'goal-1',
      weeksCount: 4,
      workoutsPerWeek: 3, // Custom value
    })

    expect(result.success).toBe(true)
  })
})
