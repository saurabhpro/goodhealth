/**
 * Unit tests for progressive overload calculator
 */

import {
  applyProgressiveOverload,
  calculateProgression,
  getProgressionStrategy,
  isDeloadWeek,
  applyDeload,
  calculateVolume,
} from '@/lib/workout-plans/planning/progressive-overload'
import type { Exercise } from '@/types'
import type { GoalType } from '@/lib/workout-plans/planning'

// Mock exercise
const createMockExercise = (name: string, sets: number, reps: number, weight: number = 0): Exercise => ({
  id: `ex-${name}`,
  workout_id: 'w1',
  name,
  exercise_type: 'strength',
  sets,
  reps,
  weight,
  weight_unit: 'kg',
  duration_minutes: null,
  distance: null,
  distance_unit: 'km',
  speed: null,
  calories: null,
  resistance_level: null,
  incline: null,
  notes: null,
  created_at: new Date().toISOString(),
})

describe('Progressive Overload', () => {
  describe('getProgressionStrategy', () => {
    it('should return appropriate strategy for muscle building', () => {
      const strategy = getProgressionStrategy('muscle_building')

      expect(strategy.weightIncrease).toBeGreaterThan(0)
      expect(strategy.repRange).toEqual([8, 12])
    })

    it('should return appropriate strategy for endurance', () => {
      const strategy = getProgressionStrategy('endurance')

      expect(strategy.weightIncrease).toBe(0)
      expect(strategy.repRange[1]).toBeGreaterThan(12)
    })

    it('should return appropriate strategy for weight loss', () => {
      const strategy = getProgressionStrategy('weight_loss')

      expect(strategy.weightIncrease).toBe(0)
      expect(strategy.restPeriod).toBeLessThan(60)
    })

    it('should return appropriate strategy for general fitness', () => {
      const strategy = getProgressionStrategy('general_fitness')

      expect(strategy.weightIncrease).toBeGreaterThanOrEqual(0)
      expect(strategy.repRange[0]).toBeGreaterThanOrEqual(8)
    })
  })

  describe('calculateProgression', () => {
    it('should create progression for all weeks', () => {
      const exercise = createMockExercise('Bench Press', 3, 10, 60)
      const weeks = 4
      const progression = calculateProgression(exercise, weeks, 'muscle_building')

      expect(progression.exercise).toBe(exercise)
      expect(progression.weeks).toHaveLength(weeks)

      // Check all weeks are present
      for (let i = 0; i < weeks; i++) {
        expect(progression.weeks[i].week).toBe(i + 1)
      }
    })

    it('should increase weight for muscle building goals', () => {
      const exercise = createMockExercise('Bench Press', 3, 10, 60)
      const progression = calculateProgression(exercise, 4, 'muscle_building')

      // Week 1 should be baseline
      expect(progression.weeks[0].weight).toBe(60)

      // Week 4 should have increased weight
      expect(progression.weeks[3].weight).toBeGreaterThan(60)
    })

    it('should handle bodyweight exercises', () => {
      const exercise = createMockExercise('Pull-ups', 3, 8, 0)
      const progression = calculateProgression(exercise, 4, 'muscle_building')

      expect(progression.weeks).toHaveLength(4)

      // For bodyweight (weight = 0), should stay 0
      expect(progression.weeks[0].weight).toBe(0)
      expect(progression.weeks[3].weight).toBe(0)
    })

    it('should maintain reasonable progression rates', () => {
      const exercise = createMockExercise('Bench Press', 3, 10, 60)
      const progression = calculateProgression(exercise, 12, 'muscle_building')

      // Check week-over-week changes are reasonable
      for (let i = 1; i < progression.weeks.length; i++) {
        const prevWeight = progression.weeks[i - 1].weight
        const currWeight = progression.weeks[i].weight

        if (prevWeight > 0) {
          const increase = (currWeight - prevWeight) / prevWeight
          expect(increase).toBeLessThan(0.1) // Less than 10% increase per week
        }
      }
    })

    it('should respect rep ranges based on goal type', () => {
      const exercise = createMockExercise('Squats', 3, 15, 40)
      const muscleProg = calculateProgression(exercise, 4, 'muscle_building')
      const enduranceProg = calculateProgression(exercise, 4, 'endurance')

      // Muscle building should use lower rep range
      expect(muscleProg.weeks[0].reps).toBeLessThanOrEqual(12)

      // Endurance should allow higher reps
      expect(enduranceProg.weeks[0].reps).toBeGreaterThanOrEqual(12)
    })
  })

  describe('applyProgressiveOverload', () => {
    it('should apply progression to strength exercises', () => {
      const exercises = [createMockExercise('Bench Press', 3, 10, 60)]

      const week1Exercises = applyProgressiveOverload(exercises, 1, 'muscle_building')
      const week4Exercises = applyProgressiveOverload(exercises, 4, 'muscle_building')

      // Week 1 should be baseline
      expect(week1Exercises[0].weight).toBe(60)

      // Week 4 should have progressed
      expect(week4Exercises[0].weight).toBeGreaterThan(60)
    })

    it('should skip cardio exercises', () => {
      const cardioExercise: Exercise = {
        id: 'ex-running',
        workout_id: 'w1',
        name: 'Running',
        exercise_type: 'cardio',
        sets: null,
        reps: null,
        weight: null,
        weight_unit: 'kg',
        duration_minutes: 30,
        distance: null,
        distance_unit: 'km',
        speed: null,
        calories: null,
        resistance_level: null,
        incline: null,
        notes: null,
        created_at: new Date().toISOString(),
      }

      const week1Exercises = applyProgressiveOverload([cardioExercise], 1, 'muscle_building')
      const week4Exercises = applyProgressiveOverload([cardioExercise], 4, 'muscle_building')

      // Cardio should remain unchanged
      expect(week1Exercises[0]).toEqual(cardioExercise)
      expect(week4Exercises[0]).toEqual(cardioExercise)
    })

    it('should handle mixed exercise lists', () => {
      const cardioExercise: Exercise = {
        id: 'ex-running',
        workout_id: 'w1',
        name: 'Running',
        exercise_type: 'cardio',
        sets: null,
        reps: null,
        weight: null,
        weight_unit: 'kg',
        duration_minutes: 30,
        distance: null,
        distance_unit: 'km',
        speed: null,
        calories: null,
        resistance_level: null,
        incline: null,
        notes: null,
        created_at: new Date().toISOString(),
      }
      const strengthExercise = createMockExercise('Bench Press', 3, 10, 60)

      const exercises = [cardioExercise, strengthExercise]
      const progressed = applyProgressiveOverload(exercises, 4, 'muscle_building')

      // Cardio unchanged
      expect(progressed[0].duration_minutes).toBe(30)

      // Strength progressed
      expect(progressed[1].weight).toBeGreaterThan(60)
    })

    it('should apply different strategies per goal type', () => {
      const exercise = createMockExercise('Deadlift', 3, 8, 100)

      const muscleWeek4 = applyProgressiveOverload([exercise], 4, 'muscle_building')
      const enduranceWeek4 = applyProgressiveOverload([exercise], 4, 'endurance')

      // Muscle building should increase weight
      expect(muscleWeek4[0].weight).toBeGreaterThan(100)

      // Endurance should increase reps/sets instead
      // (may have weight increase too, but different strategy)
      expect(enduranceWeek4[0].sets).toBeGreaterThanOrEqual(3)
    })
  })

  describe('isDeloadWeek', () => {
    it('should identify deload weeks correctly', () => {
      expect(isDeloadWeek(4)).toBe(true)
      expect(isDeloadWeek(8)).toBe(true)
      expect(isDeloadWeek(12)).toBe(true)
    })

    it('should not mark non-deload weeks', () => {
      expect(isDeloadWeek(1)).toBe(false)
      expect(isDeloadWeek(2)).toBe(false)
      expect(isDeloadWeek(3)).toBe(false)
      expect(isDeloadWeek(5)).toBe(false)
    })

    it('should support custom deload frequency', () => {
      expect(isDeloadWeek(5, 5)).toBe(true)
      expect(isDeloadWeek(10, 5)).toBe(true)
      expect(isDeloadWeek(4, 5)).toBe(false)
    })
  })

  describe('applyDeload', () => {
    it('should reduce volume for strength exercises', () => {
      const exercise = createMockExercise('Bench Press', 4, 10, 100)
      const deloaded = applyDeload([exercise])

      expect(deloaded[0].sets).toBeLessThan(4)
      expect(deloaded[0].weight).toBeLessThan(100)
    })

    it('should skip cardio exercises', () => {
      const cardioExercise: Exercise = {
        id: 'ex-running',
        workout_id: 'w1',
        name: 'Running',
        exercise_type: 'cardio',
        sets: null,
        reps: null,
        weight: null,
        weight_unit: 'kg',
        duration_minutes: 30,
        distance: null,
        distance_unit: 'km',
        speed: null,
        calories: null,
        resistance_level: null,
        incline: null,
        notes: null,
        created_at: new Date().toISOString(),
      }

      const deloaded = applyDeload([cardioExercise])

      expect(deloaded[0]).toEqual(cardioExercise)
    })
  })

  describe('calculateVolume', () => {
    it('should calculate total volume correctly', () => {
      const exercises = [
        createMockExercise('Bench Press', 3, 10, 60), // 3 * 10 * 60 = 1800
        createMockExercise('Squats', 4, 8, 80),       // 4 * 8 * 80 = 2560
      ]

      const volume = calculateVolume(exercises)

      expect(volume).toBe(4360) // 1800 + 2560
    })

    it('should exclude cardio exercises from volume', () => {
      const cardioExercise: Exercise = {
        id: 'ex-running',
        workout_id: 'w1',
        name: 'Running',
        exercise_type: 'cardio',
        sets: null,
        reps: null,
        weight: null,
        weight_unit: 'kg',
        duration_minutes: 30,
        distance: null,
        distance_unit: 'km',
        speed: null,
        calories: null,
        resistance_level: null,
        incline: null,
        notes: null,
        created_at: new Date().toISOString(),
      }
      const strengthExercise = createMockExercise('Bench Press', 3, 10, 60)

      const volume = calculateVolume([cardioExercise, strengthExercise])

      expect(volume).toBe(1800) // Only strength exercise counted
    })

    it('should handle exercises with missing values', () => {
      const exercise = createMockExercise('Push-ups', 0, 0, 0)
      exercise.sets = null
      exercise.reps = null
      exercise.weight = null

      const volume = calculateVolume([exercise])

      expect(volume).toBe(0)
    })
  })
})
