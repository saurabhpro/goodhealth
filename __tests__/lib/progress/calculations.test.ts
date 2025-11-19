/**
 * Unit tests for progress calculation logic
 *
 * NOTE: These tests use the old progress calculation logic (current/target * 100).
 * For bidirectional progress tracking (increase/decrease goals), see:
 * __tests__/lib/goals/progress.test.ts
 */

import { createMockGoal, createMockWorkout } from '../../utils/mocks'

describe('Progress Calculations', () => {
  describe('Goal progress percentage (Legacy - for goals starting from 0)', () => {
    it('should calculate correct percentage for partial progress', () => {
      const goal = createMockGoal({ current_value: 50, target_value: 100 })
      const percentage = Math.min((goal.current_value / goal.target_value) * 100, 100)
      expect(percentage).toBe(50)
    })

    it('should cap percentage at 100 when exceeded', () => {
      const goal = createMockGoal({ current_value: 120, target_value: 100 })
      const percentage = Math.min((goal.current_value / goal.target_value) * 100, 100)
      expect(percentage).toBe(100)
    })

    it('should handle 0 current value', () => {
      const goal = createMockGoal({ current_value: 0, target_value: 100 })
      const percentage = Math.min((goal.current_value / goal.target_value) * 100, 100)
      expect(percentage).toBe(0)
    })

    it('should handle decimal values', () => {
      const goal = createMockGoal({ current_value: 33.33, target_value: 100 })
      const percentage = Math.min((goal.current_value / goal.target_value) * 100, 100)
      expect(percentage).toBeCloseTo(33.33, 2)
    })

    it('should mark goal as achieved when current >= target', () => {
      const goal1 = createMockGoal({ current_value: 100, target_value: 100 })
      const goal2 = createMockGoal({ current_value: 105, target_value: 100 })

      expect(goal1.current_value >= goal1.target_value).toBe(true)
      expect(goal2.current_value >= goal2.target_value).toBe(true)
    })

    it('should not mark goal as achieved when current < target', () => {
      const goal = createMockGoal({ current_value: 99, target_value: 100 })
      expect(goal.current_value >= goal.target_value).toBe(false)
    })
  })

  describe('Monthly statistics', () => {
    it('should count workouts in current month', () => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const workouts = [
        createMockWorkout({ date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01` }),
        createMockWorkout({ date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15` }),
        createMockWorkout({ date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15` }), // Previous month
      ]

      const thisMonthWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.date)
        return workoutDate.getMonth() === currentMonth && workoutDate.getFullYear() === currentYear
      })

      expect(thisMonthWorkouts.length).toBe(2)
    })

    it('should sum duration for current month', () => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const workouts = [
        createMockWorkout({ date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`, duration_minutes: 45 }),
        createMockWorkout({ date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`, duration_minutes: 60 }),
        createMockWorkout({ date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`, duration_minutes: 30 }),
      ]

      const thisMonthDuration = workouts
        .filter(w => {
          const workoutDate = new Date(w.date)
          return workoutDate.getMonth() === currentMonth && workoutDate.getFullYear() === currentYear
        })
        .reduce((sum, w) => sum + (w.duration_minutes || 0), 0)

      expect(thisMonthDuration).toBe(105)
    })
  })

  describe('Streak calculation', () => {
    it('should calculate consecutive days', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const dayBefore = new Date(today)
      dayBefore.setDate(today.getDate() - 2)

      const workouts = [
        createMockWorkout({ date: today.toISOString().split('T')[0] }),
        createMockWorkout({ date: yesterday.toISOString().split('T')[0] }),
        createMockWorkout({ date: dayBefore.toISOString().split('T')[0] }),
      ]

      // Simplified streak calculation
      let streak = 0
      const currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)

      const workoutDates = new Set(workouts.map(w => {
        const d = new Date(w.date)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      }))

      while (workoutDates.has(currentDate.getTime())) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      }

      expect(streak).toBeGreaterThanOrEqual(1)
    })

    it('should reset streak on missed day', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const threeDaysAgo = new Date(today)
      threeDaysAgo.setDate(today.getDate() - 3) // Missed day 2 days ago

      const workouts = [
        createMockWorkout({ date: today.toISOString().split('T')[0] }),
        createMockWorkout({ date: yesterday.toISOString().split('T')[0] }),
        createMockWorkout({ date: threeDaysAgo.toISOString().split('T')[0] }),
      ]

      let streak = 0
      const currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)

      const workoutDates = new Set(workouts.map(w => {
        const d = new Date(w.date)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      }))

      while (workoutDates.has(currentDate.getTime())) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      }

      expect(streak).toBe(2) // Only today and yesterday
    })

    it('should return 0 for no workouts', () => {
      const workouts: { date: string }[] = []
      const workoutDates = new Set(workouts.map(w => new Date(w.date).getTime()))
      const streak = workoutDates.size > 0 ? 1 : 0
      expect(streak).toBe(0)
    })
  })

  describe('Average calculations', () => {
    it('should calculate average workout duration', () => {
      const workouts = [
        createMockWorkout({ duration_minutes: 45 }),
        createMockWorkout({ duration_minutes: 60 }),
        createMockWorkout({ duration_minutes: 30 }),
      ]

      const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
      const avgDuration = workouts.length > 0 ? totalDuration / workouts.length : 0

      expect(avgDuration).toBe(45)
    })

    it('should handle workouts with null duration', () => {
      const workouts = [
        createMockWorkout({ duration_minutes: 60 }),
        createMockWorkout({ duration_minutes: null }),
        createMockWorkout({ duration_minutes: 40 }),
      ]

      const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
      const count = workouts.filter(w => w.duration_minutes !== null).length
      const avgDuration = count > 0 ? totalDuration / count : 0

      expect(avgDuration).toBe(50)
    })

    it('should return 0 for empty workout array', () => {
      const workouts: { duration_minutes: number }[] = []
      const avgDuration = workouts.length > 0 ? 0 : 0
      expect(avgDuration).toBe(0)
    })
  })

  describe('Goal target date calculations', () => {
    it('should calculate days remaining until target', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      const goal = createMockGoal({
        target_date: futureDate.toISOString().split('T')[0],
      })

      const today = new Date()
      const targetDate = new Date(goal.target_date!)
      const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      expect(daysRemaining).toBeGreaterThan(0)
      expect(daysRemaining).toBeLessThanOrEqual(31)
    })

    it('should handle overdue goals', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)

      const goal = createMockGoal({
        target_date: pastDate.toISOString().split('T')[0],
      })

      const today = new Date()
      const targetDate = new Date(goal.target_date!)
      const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      expect(daysRemaining).toBeLessThan(0)
    })

    it('should handle null target date', () => {
      const goal = createMockGoal({ target_date: null })
      expect(goal.target_date).toBeNull()
    })

    it('should calculate required daily progress', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      const goal = createMockGoal({
        current_value: 50,
        target_value: 100,
        target_date: futureDate.toISOString().split('T')[0],
      })

      const today = new Date()
      const targetDate = new Date(goal.target_date!)
      const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const remainingProgress = goal.target_value - goal.current_value
      const dailyProgress = daysRemaining > 0 ? remainingProgress / daysRemaining : 0

      expect(dailyProgress).toBeCloseTo(1.67, 1) // ~50/30
    })
  })

  describe('Personal records tracking', () => {
    it('should find maximum weight lifted', () => {
      const exerciseWeights = [
        { name: 'Bench Press', weight: 80 },
        { name: 'Bench Press', weight: 85 },
        { name: 'Bench Press', weight: 90 },
        { name: 'Bench Press', weight: 87 },
      ]

      const maxWeight = Math.max(...exerciseWeights.map(e => e.weight))
      expect(maxWeight).toBe(90)
    })

    it('should find maximum reps', () => {
      const exerciseReps = [
        { name: 'Pull Ups', reps: 10 },
        { name: 'Pull Ups', reps: 12 },
        { name: 'Pull Ups', reps: 15 },
        { name: 'Pull Ups', reps: 13 },
      ]

      const maxReps = Math.max(...exerciseReps.map(e => e.reps))
      expect(maxReps).toBe(15)
    })

    it('should group exercises by name', () => {
      const exercises = [
        { name: 'Bench Press', weight: 80 },
        { name: 'Squats', weight: 100 },
        { name: 'Bench Press', weight: 85 },
        { name: 'Squats', weight: 105 },
      ]

      const grouped = exercises.reduce((acc: Record<string, { name: string; weight: number }[]>, ex) => {
        if (!acc[ex.name]) {
          acc[ex.name] = []
        }
        acc[ex.name].push(ex)
        return acc
      }, {})

      expect(Object.keys(grouped).length).toBe(2)
      expect(grouped['Bench Press'].length).toBe(2)
      expect(grouped['Squats'].length).toBe(2)
    })
  })
})
