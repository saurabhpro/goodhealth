/**
 * Unit tests for goal analyzer
 */

import { analyzeGoal, analyzeWorkoutHistory } from '@/lib/workout-plans/planning/goal-analyzer'
import type { Goal, Workout } from '@/types'

describe('Goal Analyzer', () => {
  describe('analyzeGoal', () => {
    it('should identify weight loss goal type', () => {
      const goal: Goal = {
        id: '1',
        user_id: 'user1',
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

      const history = analyzeWorkoutHistory([])
      const analysis = analyzeGoal(goal, history)

      expect(analysis.goalType).toBe('weight_loss')
      expect(analysis.recommendations.cardioToStrengthRatio).toBeGreaterThan(0.5)
      expect(analysis.recommendations.workoutsPerWeek).toBeGreaterThanOrEqual(5)
    })

    it('should identify muscle building goal type', () => {
      const goal: Goal = {
        id: '1',
        user_id: 'user1',
        title: 'Build Muscle',
        description: 'Gain 5kg of muscle',
        target_value: 85,
        current_value: 80,
        initial_value: 80,
        unit: 'kg',
        target_date: null,
        achieved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const history = analyzeWorkoutHistory([])
      const analysis = analyzeGoal(goal, history)

      expect(analysis.goalType).toBe('muscle_building')
      expect(analysis.recommendations.cardioToStrengthRatio).toBeLessThan(0.4)
      expect(analysis.recommendations.workoutsPerWeek).toBeGreaterThanOrEqual(4)
    })

    it('should identify endurance goal type', () => {
      const goal: Goal = {
        id: '1',
        user_id: 'user1',
        title: 'Run a Marathon',
        description: 'Improve running endurance',
        target_value: 42,
        current_value: 10,
        initial_value: 5,
        unit: 'km',
        target_date: null,
        achieved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const history = analyzeWorkoutHistory([])
      const analysis = analyzeGoal(goal, history)

      expect(analysis.goalType).toBe('endurance')
      expect(analysis.recommendations.cardioToStrengthRatio).toBeGreaterThan(0.7)
    })

    it('should default to general fitness for unclear goals', () => {
      const goal: Goal = {
        id: '1',
        user_id: 'user1',
        title: 'Get Fit',
        description: 'General fitness',
        target_value: 100,
        current_value: 0,
        initial_value: 0,
        unit: 'points',
        target_date: null,
        achieved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const history = analyzeWorkoutHistory([])
      const analysis = analyzeGoal(goal, history)

      expect(analysis.goalType).toBe('general_fitness')
      expect(analysis.recommendations.cardioToStrengthRatio).toBeGreaterThanOrEqual(0.4)
      expect(analysis.recommendations.cardioToStrengthRatio).toBeLessThanOrEqual(0.6)
    })

    it('should include time-based recommendations', () => {
      const goal: Goal = {
        id: '1',
        user_id: 'user1',
        title: 'Weight Loss',
        description: null,
        target_value: 70,
        current_value: 80,
        initial_value: 80,
        unit: 'kg',
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        achieved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const history = analyzeWorkoutHistory([])
      const analysis = analyzeGoal(goal, history)

      expect(analysis.timeframe).toBeGreaterThan(0)
      expect(analysis.recommendations.avgDuration).toBeGreaterThan(0)
    })
  })

  describe('analyzeWorkoutHistory', () => {
    it('should determine beginner intensity for no workouts', () => {
      const history = analyzeWorkoutHistory([])

      expect(history.workoutsLast30Days).toBe(0)
      expect(history.intensity).toBe('beginner')
    })

    it('should determine intermediate intensity for moderate activity', () => {
      const workouts: Workout[] = Array.from({ length: 12 }, (_, i) => ({
        id: `w${i}`,
        user_id: 'user1',
        date: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString(), // Every 2 days
        workout_template_id: null,
        duration: 45,
        notes: null,
        exercises: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const history = analyzeWorkoutHistory(workouts)

      expect(history.workoutsLast30Days).toBe(12)
      expect(history.intensity).toBe('intermediate')
      expect(history.avgDuration).toBe(45)
    })

    it('should determine advanced intensity for high activity', () => {
      const workouts: Workout[] = Array.from({ length: 25 }, (_, i) => ({
        id: `w${i}`,
        user_id: 'user1',
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(), // Daily
        workout_template_id: null,
        duration: 60,
        notes: null,
        exercises: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const history = analyzeWorkoutHistory(workouts)

      expect(history.workoutsLast30Days).toBe(25)
      expect(history.intensity).toBe('advanced')
    })

    it('should calculate average workout duration', () => {
      const workouts: Workout[] = [
        {
          id: 'w1',
          user_id: 'user1',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          workout_template_id: null,
          duration: 30,
          notes: null,
          exercises: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'w2',
          user_id: 'user1',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          workout_template_id: null,
          duration: 60,
          notes: null,
          exercises: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'w3',
          user_id: 'user1',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          workout_template_id: null,
          duration: 45,
          notes: null,
          exercises: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      const history = analyzeWorkoutHistory(workouts)

      expect(history.avgDuration).toBe(45) // (30 + 60 + 45) / 3
    })
  })
})
