/**
 * Unit tests for progressive overload calculator
 */

import { applyProgressiveOverload, calculateProgressionForExercise } from '@/lib/workout-plans/planning/progressive-overload'
import type { PlanSession } from '@/lib/workout-plans/planning/schedule-generator'
import type { GoalType } from '@/lib/workout-plans/planning'

// Mock exercise
const createMockExercise = (name: string, sets: number, reps: number, weight: number = 0) => ({
  name,
  exercise_type: 'strength' as const,
  sets,
  reps,
  weight,
  weight_unit: 'kg' as const,
  duration: null,
  rest_seconds: 60,
  notes: null,
})

// Mock session
const createMockSession = (week: number, exercises: any[]): PlanSession => ({
  week_number: week,
  day_of_week: 1,
  day_name: 'Monday',
  session_order: 1,
  workout_template_id: 'template1',
  workout_name: 'Test Workout',
  workout_type: 'strength',
  estimated_duration: 60,
  exercises,
  muscle_groups: ['chest'],
  intensity_level: 'moderate',
  status: 'scheduled',
  notes: null,
})

describe('Progressive Overload', () => {
  describe('calculateProgressionForExercise', () => {
    it('should increase weight for muscle building goals', () => {
      const exercise = createMockExercise('Bench Press', 3, 10, 60)
      const progressions = calculateProgressionForExercise(exercise, 4, 'muscle_building')

      expect(progressions).toHaveLength(4)

      // Week 1 should be baseline
      expect(progressions[0].weight).toBe(60)

      // Week 4 should have increased weight
      expect(progressions[3].weight).toBeGreaterThan(60)

      // Sets and reps should stay relatively constant
      expect(progressions[0].sets).toBe(progressions[3].sets)
    })

    it('should increase reps for endurance goals', () => {
      const exercise = createMockExercise('Push-ups', 3, 10, 0)
      const progressions = calculateProgressionForExercise(exercise, 4, 'endurance')

      expect(progressions).toHaveLength(4)

      // Week 1 baseline
      expect(progressions[0].reps).toBe(10)

      // Week 4 should have more reps
      expect(progressions[3].reps).toBeGreaterThan(10)

      // Weight should stay the same (bodyweight)
      expect(progressions[0].weight).toBe(progressions[3].weight)
    })

    it('should maintain moderate progression for weight loss', () => {
      const exercise = createMockExercise('Squats', 3, 12, 40)
      const progressions = calculateProgressionForExercise(exercise, 4, 'weight_loss')

      expect(progressions).toHaveLength(4)

      // Should have some progression but not aggressive
      const week1Volume = progressions[0].sets * progressions[0].reps * progressions[0].weight
      const week4Volume = progressions[3].sets * progressions[3].reps * progressions[3].weight

      expect(week4Volume).toBeGreaterThanOrEqual(week1Volume)
    })

    it('should handle bodyweight exercises', () => {
      const exercise = createMockExercise('Pull-ups', 3, 8, 0)
      const progressions = calculateProgressionForExercise(exercise, 4, 'muscle_building')

      expect(progressions).toHaveLength(4)

      // For bodyweight, should increase reps or sets
      const week1Volume = progressions[0].sets * progressions[0].reps
      const week4Volume = progressions[3].sets * progressions[3].reps

      expect(week4Volume).toBeGreaterThan(week1Volume)
    })

    it('should create progression for all weeks', () => {
      const exercise = createMockExercise('Deadlift', 3, 8, 100)
      const weeks = 8
      const progressions = calculateProgressionForExercise(exercise, weeks, 'muscle_building')

      expect(progressions).toHaveLength(weeks)

      // Each week should be present
      for (let i = 0; i < weeks; i++) {
        expect(progressions[i].week).toBe(i + 1)
      }
    })

    it('should maintain reasonable progression rates', () => {
      const exercise = createMockExercise('Bench Press', 3, 10, 60)
      const progressions = calculateProgressionForExercise(exercise, 12, 'muscle_building')

      // Check week-over-week changes are reasonable (not doubling every week)
      for (let i = 1; i < progressions.length; i++) {
        const prevWeight = progressions[i - 1].weight || 0
        const currWeight = progressions[i].weight || 0

        if (prevWeight > 0) {
          const increase = (currWeight - prevWeight) / prevWeight
          expect(increase).toBeLessThan(0.1) // Less than 10% increase per week
        }
      }
    })

    it('should preserve exercise name and type', () => {
      const exercise = createMockExercise('Shoulder Press', 3, 12, 30)
      const progressions = calculateProgressionForExercise(exercise, 4, 'muscle_building')

      for (const progression of progressions) {
        expect(progression.name).toBe('Shoulder Press')
        expect(progression.exercise_type).toBe('strength')
      }
    })
  })

  describe('applyProgressiveOverload', () => {
    it('should apply overload to all exercises in all sessions', () => {
      const exercises = [
        createMockExercise('Exercise 1', 3, 10, 50),
        createMockExercise('Exercise 2', 3, 12, 30),
      ]

      const sessions = [
        createMockSession(1, exercises),
        createMockSession(2, exercises),
        createMockSession(3, exercises),
      ]

      const progressedSessions = applyProgressiveOverload(sessions, 'muscle_building')

      expect(progressedSessions).toHaveLength(3)

      // Week 1 should be baseline
      const week1Ex1 = progressedSessions[0].exercises[0] as any
      expect(week1Ex1.weight).toBe(50)

      // Week 3 should have progressed
      const week3Ex1 = progressedSessions[2].exercises[0] as any
      expect(week3Ex1.weight).toBeGreaterThan(50)
    })

    it('should handle sessions without exercises', () => {
      const sessions = [
        createMockSession(1, []),
        createMockSession(2, []),
      ]

      const progressedSessions = applyProgressiveOverload(sessions, 'general_fitness')

      expect(progressedSessions).toHaveLength(2)
      expect(progressedSessions[0].exercises).toHaveLength(0)
    })

    it('should preserve non-strength exercises', () => {
      const exercises = [
        { ...createMockExercise('Running', 1, 1, 0), exercise_type: 'cardio' as const, duration: 1800 },
        createMockExercise('Bench Press', 3, 10, 60),
      ]

      const sessions = [createMockSession(1, exercises)]

      const progressedSessions = applyProgressiveOverload(sessions, 'muscle_building')

      // Cardio exercise should remain unchanged
      const cardioEx = progressedSessions[0].exercises[0] as any
      expect(cardioEx.duration).toBe(1800)
    })

    it('should maintain session metadata', () => {
      const exercises = [createMockExercise('Squats', 3, 10, 80)]
      const sessions = [createMockSession(1, exercises)]

      const progressedSessions = applyProgressiveOverload(sessions, 'muscle_building')

      expect(progressedSessions[0].workout_name).toBe('Test Workout')
      expect(progressedSessions[0].day_name).toBe('Monday')
      expect(progressedSessions[0].muscle_groups).toEqual(['chest'])
    })

    it('should handle different goal types appropriately', () => {
      const exercises = [createMockExercise('Deadlift', 3, 8, 100)]

      const goalTypes: GoalType[] = ['muscle_building', 'endurance', 'weight_loss', 'general_fitness']

      for (const goalType of goalTypes) {
        const sessions = [createMockSession(1, exercises), createMockSession(4, exercises)]
        const progressedSessions = applyProgressiveOverload(sessions, goalType)

        expect(progressedSessions).toHaveLength(2)

        // Week 4 should show some form of progression
        const week1 = progressedSessions[0].exercises[0] as any
        const week4 = progressedSessions[1].exercises[0] as any

        const week1Volume = week1.sets * week1.reps * (week1.weight || 1)
        const week4Volume = week4.sets * week4.reps * (week4.weight || 1)

        expect(week4Volume).toBeGreaterThanOrEqual(week1Volume)
      }
    })

    it('should create independent progressions for each exercise', () => {
      const exercises = [
        createMockExercise('Exercise A', 3, 10, 50),
        createMockExercise('Exercise B', 3, 12, 30),
      ]

      const sessions = [createMockSession(1, exercises), createMockSession(3, exercises)]

      const progressedSessions = applyProgressiveOverload(sessions, 'muscle_building')

      const week3ExA = progressedSessions[1].exercises[0] as any
      const week3ExB = progressedSessions[1].exercises[1] as any

      // Both should progress but potentially at different rates
      expect(week3ExA.weight).toBeGreaterThan(50)
      expect(week3ExB.weight).toBeGreaterThan(30)
    })
  })
})
