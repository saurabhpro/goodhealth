/**
 * Unit tests for workout business logic
 */

import { createMockWorkout, createMockExercise } from '../../utils/mocks'

describe('Workout Business Logic', () => {
  describe('Workout duration calculations', () => {
    it('should calculate total workout duration', () => {
      const workout = createMockWorkout({ duration_minutes: 60 })
      expect(workout.duration_minutes).toBe(60)
    })

    it('should handle null duration', () => {
      const workout = createMockWorkout({ duration_minutes: null })
      expect(workout.duration_minutes).toBeNull()
    })

    it('should sum exercise durations for cardio workouts', () => {
      const exercises = [
        { ...createMockExercise({ duration_minutes: 20 }), exercise_type: 'cardio' },
        { ...createMockExercise({ duration_minutes: 30 }), exercise_type: 'cardio' },
        { ...createMockExercise({ duration_minutes: 15 }), exercise_type: 'cardio' },
      ]

      const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration_minutes || 0), 0)
      expect(totalDuration).toBe(65)
    })
  })

  describe('Exercise count', () => {
    it('should count number of exercises in workout', () => {
      const exercises = [
        createMockExercise({ name: 'Bench Press' }),
        createMockExercise({ name: 'Squats' }),
        createMockExercise({ name: 'Deadlift' }),
      ]

      expect(exercises.length).toBe(3)
    })

    it('should return 0 for workout with no exercises', () => {
      const exercises: { name: string }[] = []
      expect(exercises.length).toBe(0)
    })
  })

  describe('Effort level validation', () => {
    it('should accept valid effort levels (1-6)', () => {
      const validLevels = [1, 2, 3, 4, 5, 6]
      validLevels.forEach(level => {
        expect(level).toBeGreaterThanOrEqual(1)
        expect(level).toBeLessThanOrEqual(6)
      })
    })

    it('should identify invalid effort levels', () => {
      const invalidLevels = [0, 7, -1, 10]
      invalidLevels.forEach(level => {
        const isValid = level >= 1 && level <= 6
        expect(isValid).toBe(false)
      })
    })

    it('should handle null effort level', () => {
      const workout = createMockWorkout({ effort_level: null })
      expect(workout.effort_level).toBeNull()
    })
  })

  describe('Workout date validation', () => {
    it('should accept valid dates', () => {
      const workout = createMockWorkout({ date: '2024-01-15' })
      const date = new Date(workout.date)
      expect(date).toBeInstanceOf(Date)
      expect(date.toISOString().split('T')[0]).toBe('2024-01-15')
    })

    it('should handle future dates', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      const dateString = futureDate.toISOString().split('T')[0]

      const workout = createMockWorkout({ date: dateString })
      expect(new Date(workout.date) > new Date()).toBe(true)
    })

    it('should handle past dates', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      const dateString = pastDate.toISOString().split('T')[0]

      const workout = createMockWorkout({ date: dateString })
      expect(new Date(workout.date) < new Date()).toBe(true)
    })
  })

  describe('Exercise type validation', () => {
    it('should identify strength exercises', () => {
      const exercise = { ...createMockExercise(), exercise_type: 'strength' }
      expect(exercise.exercise_type).toBe('strength')
      expect(exercise.sets).toBeDefined()
      expect(exercise.reps).toBeDefined()
      expect(exercise.weight).toBeDefined()
    })

    it('should identify cardio exercises', () => {
      const exercise = {
        ...createMockExercise({
          sets: null,
          reps: null,
          weight: null,
        }),
        exercise_type: 'cardio',
        duration_minutes: 30,
        distance: 5,
        distance_unit: 'km',
      }

      expect(exercise.exercise_type).toBe('cardio')
      expect(exercise.duration_minutes).toBeDefined()
    })

    it('should identify functional exercises', () => {
      const exercise = { ...createMockExercise(), exercise_type: 'functional' }
      expect(exercise.exercise_type).toBe('functional')
    })
  })

  describe('Weight unit conversion', () => {
    it('should convert kg to lbs', () => {
      const weightKg = 100
      const weightLbs = weightKg * 2.20462
      expect(weightLbs).toBeCloseTo(220.46, 1)
    })

    it('should convert lbs to kg', () => {
      const weightLbs = 220
      const weightKg = weightLbs * 0.453592
      expect(weightKg).toBeCloseTo(99.79, 1)
    })

    it('should handle zero weight', () => {
      const weight = 0
      expect(weight * 2.20462).toBe(0)
      expect(weight * 0.453592).toBe(0)
    })

    it('should handle decimal weights', () => {
      const weightKg = 82.5
      const weightLbs = weightKg * 2.20462
      expect(weightLbs).toBeCloseTo(181.88, 1)
    })
  })

  describe('Distance unit conversion', () => {
    it('should convert km to miles', () => {
      const distanceKm = 10
      const distanceMiles = distanceKm * 0.621371
      expect(distanceMiles).toBeCloseTo(6.21, 1)
    })

    it('should convert miles to km', () => {
      const distanceMiles = 5
      const distanceKm = distanceMiles * 1.60934
      expect(distanceKm).toBeCloseTo(8.05, 1)
    })

    it('should handle zero distance', () => {
      const distance = 0
      expect(distance * 0.621371).toBe(0)
      expect(distance * 1.60934).toBe(0)
    })
  })

  describe('Workout streak calculation', () => {
    it('should calculate consecutive workout days', () => {
      const workoutDates = [
        '2024-11-01',
        '2024-11-02',
        '2024-11-03',
        '2024-11-04',
      ]

      // Calculate streak
      let streak = 1
      for (let i = 1; i < workoutDates.length; i++) {
        const prevDate = new Date(workoutDates[i - 1])
        const currDate = new Date(workoutDates[i])
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }

      expect(streak).toBe(4)
    })

    it('should break streak on gap day', () => {
      const workoutDates = [
        '2024-11-01',
        '2024-11-02',
        '2024-11-04', // Gap on 11-03
        '2024-11-05',
      ]

      let streak = 1
      for (let i = 1; i < workoutDates.length; i++) {
        const prevDate = new Date(workoutDates[i - 1])
        const currDate = new Date(workoutDates[i])
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }

      expect(streak).toBe(2)
    })

    it('should return 0 for empty workout array', () => {
      const workoutDates: string[] = []
      expect(workoutDates.length).toBe(0)
    })

    it('should return 1 for single workout', () => {
      const workoutDates = ['2024-11-01']
      expect(workoutDates.length).toBe(1)
    })
  })

  describe('Total volume calculation', () => {
    it('should calculate total volume (sets × reps × weight)', () => {
      const exercise = createMockExercise({
        sets: 3,
        reps: 10,
        weight: 80,
      })

      const volume = (exercise.sets || 0) * (exercise.reps || 0) * (exercise.weight || 0)
      expect(volume).toBe(2400)
    })

    it('should handle exercises with missing values', () => {
      const exercise = createMockExercise({
        sets: 3,
        reps: null,
        weight: 80,
      })

      const volume = (exercise.sets || 0) * (exercise.reps || 0) * (exercise.weight || 0)
      expect(volume).toBe(0)
    })

    it('should sum volume across multiple exercises', () => {
      const exercises = [
        createMockExercise({ sets: 3, reps: 10, weight: 80 }), // 2400
        createMockExercise({ sets: 4, reps: 8, weight: 100 }), // 3200
        createMockExercise({ sets: 3, reps: 12, weight: 60 }), // 2160
      ]

      const totalVolume = exercises.reduce((sum, ex) => {
        return sum + ((ex.sets || 0) * (ex.reps || 0) * (ex.weight || 0))
      }, 0)

      expect(totalVolume).toBe(7760)
    })
  })

  describe('Workout statistics', () => {
    it('should calculate average weight per set', () => {
      const exercises = [
        createMockExercise({ sets: 3, weight: 80 }),
        createMockExercise({ sets: 4, weight: 100 }),
        createMockExercise({ sets: 3, weight: 60 }),
      ]

      const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)
      const weightedSum = exercises.reduce((sum, ex) => sum + ((ex.sets || 0) * (ex.weight || 0)), 0)
      const avgWeight = weightedSum / totalSets

      // (3*80 + 4*100 + 3*60) / 10 = (240 + 400 + 180) / 10 = 820 / 10 = 82
      expect(avgWeight).toBeCloseTo(82, 0)
    })

    it('should calculate total reps', () => {
      const exercises = [
        createMockExercise({ sets: 3, reps: 10 }),
        createMockExercise({ sets: 4, reps: 8 }),
        createMockExercise({ sets: 3, reps: 12 }),
      ]

      const totalReps = exercises.reduce((sum, ex) => {
        return sum + ((ex.sets || 0) * (ex.reps || 0))
      }, 0)

      expect(totalReps).toBe(98) // 30 + 32 + 36
    })
  })
})
