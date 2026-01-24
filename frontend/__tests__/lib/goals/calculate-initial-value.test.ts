/**
 * Unit tests for goal initial value calculation logic
 */

import { calculateInitialValue } from '@/lib/goals/calculate-initial-value'
import { createMockSupabaseClient, createMockUser, createMockWorkout, createMockExercise, createMockQueryBuilder } from '../../utils/mocks'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockSupabase = createMockSupabaseClient()

// Helper to get mocked createClient
// eslint-disable-next-line @typescript-eslint/no-require-imports
const getMockCreateClient = () => require('@/lib/supabase/server').createClient

describe('calculateInitialValue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Setup default auth mock
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: createMockUser() },
      error: null,
    })
  })

  describe('Workout count calculation', () => {
    it('should calculate total workout count', async () => {
      const workouts = [
        createMockWorkout({ id: 'w1', date: '2024-11-01' }),
        createMockWorkout({ id: 'w2', date: '2024-11-05' }),
        createMockWorkout({ id: 'w3', date: '2024-11-10' }),
      ]

      mockSupabase.from.mockReturnValue(
        createMockQueryBuilder(workouts)
      )

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('workouts', 'Complete 10 workouts')

      expect(result).toBe(3)
    })

    it('should return 0 when no workouts found', async () => {
      mockSupabase.from.mockReturnValue(
        createMockQueryBuilder([])
      )

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('workouts', 'Complete 10 workouts')

      expect(result).toBe(0)
    })
  })

  describe('Minutes calculation', () => {
    it('should sum up workout durations', async () => {
      const workouts = [
        createMockWorkout({ duration_minutes: 30 }),
        createMockWorkout({ duration_minutes: 45 }),
        createMockWorkout({ duration_minutes: 60 }),
      ]

      mockSupabase.from.mockReturnValue(
        createMockQueryBuilder(workouts)
      )

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('minutes', 'Workout for 200 minutes')

      expect(result).toBe(135)
    })

    it('should handle workouts with null duration', async () => {
      const workouts = [
        createMockWorkout({ duration_minutes: 30 }),
        createMockWorkout({ duration_minutes: null }),
        createMockWorkout({ duration_minutes: 45 }),
      ]

      mockSupabase.from.mockReturnValue(
        createMockQueryBuilder(workouts)
      )

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('minutes', 'Workout for 200 minutes')

      expect(result).toBe(75)
    })
  })

  describe('Days calculation', () => {
    it('should count unique workout days', async () => {
      const workouts = [
        createMockWorkout({ date: '2024-11-01' }),
        createMockWorkout({ date: '2024-11-01' }), // Same day
        createMockWorkout({ date: '2024-11-02' }),
        createMockWorkout({ date: '2024-11-03' }),
      ]

      mockSupabase.from.mockReturnValue(
        createMockQueryBuilder(workouts)
      )

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('days', 'Workout 30 days')

      expect(result).toBe(3)
    })
  })

  describe('Weight calculation', () => {
    it('should find maximum weight for exercise in kg', async () => {
      const exercises = [
        createMockExercise({ name: 'Bench Press', weight: 80, weight_unit: 'kg', workout_id: 'w1' }),
        createMockExercise({ name: 'Bench Press', weight: 85, weight_unit: 'kg', workout_id: 'w2' }),
        createMockExercise({ name: 'Bench Press', weight: 90, weight_unit: 'kg', workout_id: 'w3' }),
      ]

      const workouts = [
        createMockWorkout({ id: 'w1', date: '2024-11-01' }),
        createMockWorkout({ id: 'w2', date: '2024-11-05' }),
        createMockWorkout({ id: 'w3', date: '2024-11-10' }),
      ]

      // Mock for exercises query
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return createMockQueryBuilder(exercises)
        }
        if (table === 'workouts') {
          return createMockQueryBuilder(workouts)
        }
        return createMockQueryBuilder([])
      })

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('kg', 'Bench Press 100kg')

      expect(result).toBe(90)
    })

    it('should convert lbs to kg when unit is kg', async () => {
      const exercises = [
        createMockExercise({ name: 'Bench Press', weight: 200, weight_unit: 'lbs', workout_id: 'w1' }), // ~90.7 kg
        createMockExercise({ name: 'Bench Press', weight: 180, weight_unit: 'lbs', workout_id: 'w2' }), // ~81.6 kg
      ]

      const workouts = [
        createMockWorkout({ id: 'w1', date: '2024-11-01' }),
        createMockWorkout({ id: 'w2', date: '2024-11-05' }),
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return createMockQueryBuilder(exercises)
        }
        if (table === 'workouts') {
          return createMockQueryBuilder(workouts)
        }
        return createMockQueryBuilder([])
      })

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('kg', 'Bench Press 100kg')

      expect(result).toBeCloseTo(90.7, 0)
    })

    it('should return 0 when exercise name cannot be extracted', async () => {
      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('kg', '100')

      expect(result).toBe(0)
    })
  })

  describe('Reps calculation', () => {
    it('should find maximum reps for exercise', async () => {
      const exercises = [
        createMockExercise({ name: 'Pull Ups', reps: 10, workout_id: 'w1' }),
        createMockExercise({ name: 'Pull Ups', reps: 12, workout_id: 'w2' }),
        createMockExercise({ name: 'Pull Ups', reps: 15, workout_id: 'w3' }),
      ]

      const workouts = [
        createMockWorkout({ id: 'w1', date: '2024-11-01' }),
        createMockWorkout({ id: 'w2', date: '2024-11-05' }),
        createMockWorkout({ id: 'w3', date: '2024-11-10' }),
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return createMockQueryBuilder(exercises)
        }
        if (table === 'workouts') {
          return createMockQueryBuilder(workouts)
        }
        return createMockQueryBuilder([])
      })

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('reps', 'Pull Ups 20 reps')

      expect(result).toBe(15)
    })
  })

  describe('Distance calculation', () => {
    it('should sum total distance in km', async () => {
      const exercises = [
        { ...createMockExercise({ name: 'Running', distance: 5, distance_unit: 'km', workout_id: 'w1' }), exercise_type: 'cardio' },
        { ...createMockExercise({ name: 'Running', distance: 7, distance_unit: 'km', workout_id: 'w2' }), exercise_type: 'cardio' },
        { ...createMockExercise({ name: 'Running', distance: 10, distance_unit: 'km', workout_id: 'w3' }), exercise_type: 'cardio' },
      ]

      const workouts = [
        createMockWorkout({ id: 'w1', date: '2024-11-01' }),
        createMockWorkout({ id: 'w2', date: '2024-11-05' }),
        createMockWorkout({ id: 'w3', date: '2024-11-10' }),
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return createMockQueryBuilder(exercises)
        }
        if (table === 'workouts') {
          return createMockQueryBuilder(workouts)
        }
        return createMockQueryBuilder([])
      })

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('km', 'Run 50km')

      expect(result).toBe(22)
    })

    it('should convert miles to km when unit is km', async () => {
      const exercises = [
        { ...createMockExercise({ name: 'Running', distance: 5, distance_unit: 'miles', workout_id: 'w1' }), exercise_type: 'cardio' }, // ~8.05 km
        { ...createMockExercise({ name: 'Running', distance: 3, distance_unit: 'miles', workout_id: 'w2' }), exercise_type: 'cardio' }, // ~4.83 km
      ]

      const workouts = [
        createMockWorkout({ id: 'w1', date: '2024-11-01' }),
        createMockWorkout({ id: 'w2', date: '2024-11-05' }),
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return createMockQueryBuilder(exercises)
        }
        if (table === 'workouts') {
          return createMockQueryBuilder(workouts)
        }
        return createMockQueryBuilder([])
      })

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('km', 'Run 50km')

      expect(result).toBeCloseTo(12.87, 1)
    })
  })

  describe('Unknown unit', () => {
    it('should return 0 for unknown units', async () => {
      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('unknown-unit', 'Test goal')

      expect(result).toBe(0)
    })
  })

  describe('Error handling', () => {
    it('should return 0 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('workouts', 'Complete 10 workouts')

      expect(result).toBe(0)
    })

    it('should return 0 when query fails', async () => {
      mockSupabase.from.mockReturnValue(
        createMockQueryBuilder(null, { message: 'Database error' })
      )

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('workouts', 'Complete 10 workouts')

      expect(result).toBe(0)
    })

    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const createClient = getMockCreateClient()
      createClient.mockResolvedValue(mockSupabase)

      const result = await calculateInitialValue('workouts', 'Complete 10 workouts')

      expect(result).toBe(0)
    })
  })
})
