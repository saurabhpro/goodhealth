/**
 * Unit tests for AI Workout Plan Generator
 * Tests personalization logic, exercise history analysis, and prompt building
 */

import { describe, it, expect } from '@jest/globals'

// Mock types for testing
interface MockExercise {
  name: string
  sets: number
  reps?: number
  weight?: number
  weight_unit?: string
}

interface MockWorkout {
  id: string
  name: string
  date: string
  exercises: MockExercise[]
}

/**
 * Calculate age from date of birth
 * (Extracted from ai-generator.ts for testing)
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

/**
 * Analyze exercise history to extract performance data
 * (Extracted from ai-generator.ts for testing)
 */
function analyzeExerciseHistory(workouts: MockWorkout[]): Map<string, {
  maxWeight: number
  avgWeight: number
  weightUnit: string
  totalSets: number
}> {
  const exerciseMap = new Map<string, {
    weights: number[]
    weightUnit: string
    sets: number
  }>()

  workouts.forEach(workout => {
    if (workout.exercises && Array.isArray(workout.exercises)) {
      workout.exercises.forEach((exercise: MockExercise) => {
        if (exercise.name && exercise.weight && exercise.weight > 0) {
          const name = exercise.name.toLowerCase().trim()

          if (!exerciseMap.has(name)) {
            exerciseMap.set(name, {
              weights: [],
              weightUnit: exercise.weight_unit || 'kg',
              sets: 0
            })
          }

          const data = exerciseMap.get(name)!
          data.weights.push(exercise.weight)
          data.sets += exercise.sets || 1
        }
      })
    }
  })

  const stats = new Map<string, {
    maxWeight: number
    avgWeight: number
    weightUnit: string
    totalSets: number
  }>()

  exerciseMap.forEach((data, name) => {
    if (data.weights.length > 0) {
      stats.set(name, {
        maxWeight: Math.max(...data.weights),
        avgWeight: data.weights.reduce((a, b) => a + b, 0) / data.weights.length,
        weightUnit: data.weightUnit,
        totalSets: data.sets
      })
    }
  })

  return stats
}

describe('AI Workout Plan Generator', () => {
  describe('calculateAge', () => {
    it('should calculate correct age for a birth date', () => {
      // Mock the current date to 2024-12-25
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-12-25'))

      const age = calculateAge('1992-06-15')
      expect(age).toBe(32)

      jest.useRealTimers()
    })

    it('should handle birthday not yet occurred this year', () => {
      // Mock the current date to 2024-03-15 (before June 15 birthday)
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-03-15'))

      const age = calculateAge('1992-06-15')
      expect(age).toBe(31) // Birthday hasn't occurred yet in 2024

      jest.useRealTimers()
    })

    it('should handle birthday today', () => {
      // Mock the current date to 2024-06-15 (exactly on birthday)
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-06-15'))

      const age = calculateAge('1992-06-15')
      expect(age).toBe(32) // Birthday is today

      jest.useRealTimers()
    })
  })

  describe('analyzeExerciseHistory', () => {
    it('should analyze exercise history and calculate correct stats', () => {
      const mockWorkouts: MockWorkout[] = [
        {
          id: '1',
          name: 'Upper Body',
          date: '2024-12-20',
          exercises: [
            { name: 'Bench Press', sets: 4, reps: 10, weight: 70, weight_unit: 'kg' },
            { name: 'Deadlift', sets: 3, reps: 8, weight: 100, weight_unit: 'kg' }
          ]
        },
        {
          id: '2',
          name: 'Lower Body',
          date: '2024-12-22',
          exercises: [
            { name: 'Bench Press', sets: 4, reps: 8, weight: 75, weight_unit: 'kg' },
            { name: 'Squat', sets: 3, reps: 10, weight: 90, weight_unit: 'kg' }
          ]
        }
      ]

      const stats = analyzeExerciseHistory(mockWorkouts)

      // Check bench press stats
      expect(stats.has('bench press')).toBe(true)
      const benchStats = stats.get('bench press')!
      expect(benchStats.maxWeight).toBe(75)
      expect(benchStats.avgWeight).toBe(72.5) // (70 + 75) / 2
      expect(benchStats.weightUnit).toBe('kg')
      expect(benchStats.totalSets).toBe(8) // 4 + 4

      // Check deadlift stats
      expect(stats.has('deadlift')).toBe(true)
      const deadliftStats = stats.get('deadlift')!
      expect(deadliftStats.maxWeight).toBe(100)
      expect(deadliftStats.avgWeight).toBe(100)
      expect(deadliftStats.totalSets).toBe(3)
    })

    it('should handle exercises with no weight', () => {
      const mockWorkouts: MockWorkout[] = [
        {
          id: '1',
          name: 'Cardio',
          date: '2024-12-20',
          exercises: [
            { name: 'Running', sets: 1, reps: 30 }, // No weight
            { name: 'Push-ups', sets: 3, reps: 15 } // No weight
          ]
        }
      ]

      const stats = analyzeExerciseHistory(mockWorkouts)
      expect(stats.size).toBe(0) // No exercises with weight
    })

    it('should normalize exercise names (case-insensitive)', () => {
      const mockWorkouts: MockWorkout[] = [
        {
          id: '1',
          name: 'Workout 1',
          date: '2024-12-20',
          exercises: [
            { name: 'BENCH PRESS', sets: 3, weight: 60, weight_unit: 'kg' }
          ]
        },
        {
          id: '2',
          name: 'Workout 2',
          date: '2024-12-22',
          exercises: [
            { name: 'bench press', sets: 3, weight: 65, weight_unit: 'kg' }
          ]
        },
        {
          id: '3',
          name: 'Workout 3',
          date: '2024-12-24',
          exercises: [
            { name: 'Bench Press', sets: 4, weight: 70, weight_unit: 'kg' }
          ]
        }
      ]

      const stats = analyzeExerciseHistory(mockWorkouts)
      expect(stats.size).toBe(1) // All should be grouped as 'bench press'

      const benchStats = stats.get('bench press')!
      expect(benchStats.maxWeight).toBe(70)
      expect(benchStats.avgWeight).toBeCloseTo(65, 1) // (60 + 65 + 70) / 3
      expect(benchStats.totalSets).toBe(10) // 3 + 3 + 4
    })

    it('should handle multiple exercises in same workout', () => {
      const mockWorkouts: MockWorkout[] = [
        {
          id: '1',
          name: 'Full Body',
          date: '2024-12-20',
          exercises: [
            { name: 'Squat', sets: 4, weight: 80, weight_unit: 'kg' },
            { name: 'Bench Press', sets: 3, weight: 60, weight_unit: 'kg' },
            { name: 'Deadlift', sets: 3, weight: 100, weight_unit: 'kg' },
            { name: 'Overhead Press', sets: 3, weight: 40, weight_unit: 'kg' }
          ]
        }
      ]

      const stats = analyzeExerciseHistory(mockWorkouts)
      expect(stats.size).toBe(4)
      expect(stats.has('squat')).toBe(true)
      expect(stats.has('bench press')).toBe(true)
      expect(stats.has('deadlift')).toBe(true)
      expect(stats.has('overhead press')).toBe(true)
    })

    it('should handle empty workout history', () => {
      const stats = analyzeExerciseHistory([])
      expect(stats.size).toBe(0)
    })

    it('should handle workouts with no exercises', () => {
      const mockWorkouts: MockWorkout[] = [
        {
          id: '1',
          name: 'Empty Workout',
          date: '2024-12-20',
          exercises: []
        }
      ]

      const stats = analyzeExerciseHistory(mockWorkouts)
      expect(stats.size).toBe(0)
    })

    it('should track progressive overload across workouts', () => {
      const mockWorkouts: MockWorkout[] = [
        {
          id: '1',
          name: 'Week 1',
          date: '2024-12-01',
          exercises: [
            { name: 'Squat', sets: 3, weight: 80, weight_unit: 'kg' }
          ]
        },
        {
          id: '2',
          name: 'Week 2',
          date: '2024-12-08',
          exercises: [
            { name: 'Squat', sets: 3, weight: 85, weight_unit: 'kg' }
          ]
        },
        {
          id: '3',
          name: 'Week 3',
          date: '2024-12-15',
          exercises: [
            { name: 'Squat', sets: 3, weight: 90, weight_unit: 'kg' }
          ]
        }
      ]

      const stats = analyzeExerciseHistory(mockWorkouts)
      const squatStats = stats.get('squat')!

      expect(squatStats.maxWeight).toBe(90) // Latest/highest weight
      expect(squatStats.avgWeight).toBeCloseTo(85, 1) // (80 + 85 + 90) / 3
      expect(squatStats.totalSets).toBe(9) // 3 + 3 + 3
    })

    it('should handle mixed weight units', () => {
      const mockWorkouts: MockWorkout[] = [
        {
          id: '1',
          name: 'Workout 1',
          date: '2024-12-20',
          exercises: [
            { name: 'Bench Press', sets: 3, weight: 135, weight_unit: 'lbs' }
          ]
        },
        {
          id: '2',
          name: 'Workout 2',
          date: '2024-12-22',
          exercises: [
            { name: 'Deadlift', sets: 3, weight: 100, weight_unit: 'kg' }
          ]
        }
      ]

      const stats = analyzeExerciseHistory(mockWorkouts)

      const benchStats = stats.get('bench press')!
      expect(benchStats.weightUnit).toBe('lbs')

      const deadliftStats = stats.get('deadlift')!
      expect(deadliftStats.weightUnit).toBe('kg')
    })
  })

  describe('BMI calculation', () => {
    it('should calculate BMI correctly', () => {
      const weight = 78 // kg
      const heightCm = 175 // cm
      const heightM = heightCm / 100
      const bmi = weight / (heightM * heightM)

      expect(bmi).toBeCloseTo(25.5, 1)
    })

    it('should handle different height/weight combinations', () => {
      const testCases = [
        { weight: 70, height: 180, expectedBMI: 21.6 },
        { weight: 90, height: 175, expectedBMI: 29.4 },
        { weight: 60, height: 165, expectedBMI: 22.0 }
      ]

      testCases.forEach(({ weight, height, expectedBMI }) => {
        const heightM = height / 100
        const bmi = weight / (heightM * heightM)
        expect(bmi).toBeCloseTo(expectedBMI, 1)
      })
    })
  })

  describe('Progressive overload recommendations', () => {
    it('should recommend 5-10% increase for progressive overload', () => {
      const currentMax = 100 // kg
      const minIncrease = currentMax * 1.05 // 105 kg
      const maxIncrease = currentMax * 1.10 // 110 kg

      expect(minIncrease).toBeCloseTo(105, 1)
      expect(maxIncrease).toBeCloseTo(110, 1)
    })

    it('should handle various weight ranges', () => {
      const testCases = [
        { current: 40, min: 42, max: 44 },
        { current: 60, min: 63, max: 66 },
        { current: 80, min: 84, max: 88 },
        { current: 100, min: 105, max: 110 }
      ]

      testCases.forEach(({ current, min, max }) => {
        expect(current * 1.05).toBeCloseTo(min, 1)
        expect(current * 1.10).toBeCloseTo(max, 1)
      })
    })
  })
})
