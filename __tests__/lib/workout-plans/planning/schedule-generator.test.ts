/**
 * Unit tests for schedule generator
 */

import { generateMultiWeekPlan, distributeRestDays } from '@/lib/workout-plans/planning/schedule-generator'
import type { WorkoutTemplate } from '@/types'
import type { GoalAnalysis } from '@/lib/workout-plans/planning/goal-analyzer'

// Mock goal analysis
const createMockGoalAnalysis = (workoutsPerWeek: number): GoalAnalysis => ({
  goalType: 'general_fitness',
  targetValue: 100,
  currentValue: 80,
  timeframe: 90,
  intensity: 'intermediate',
  recommendations: {
    workoutsPerWeek,
    cardioToStrengthRatio: 0.5,
    avgDuration: 60,
    restDaysPerWeek: 7 - workoutsPerWeek,
  },
})

// Mock workout template
const createMockTemplate = (id: string, type: 'cardio' | 'strength'): WorkoutTemplate => ({
  id,
  user_id: 'user1',
  name: `${type} Template ${id}`,
  description: `A ${type} workout`,
  estimated_duration: 60,
  exercises: type === 'cardio'
    ? [{ exercise_type: 'cardio' as const, name: 'Running', duration: 1800, sets: null, reps: null, weight: null }]
    : [{ exercise_type: 'strength' as const, name: 'Bench Press', sets: 3, reps: 10, weight: 60 }],
  is_public: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

describe('Schedule Generator', () => {
  describe('distributeRestDays', () => {
    it('should return empty array for 0 rest days', () => {
      const restDays = distributeRestDays(0, 7)
      expect(restDays).toEqual([])
    })

    it('should return all days for 7 rest days', () => {
      const restDays = distributeRestDays(7, 0)
      expect(restDays).toHaveLength(7)
      expect(restDays).toEqual([0, 1, 2, 3, 4, 5, 6])
    })

    it('should prefer Sunday and Wednesday for 2 rest days', () => {
      const restDays = distributeRestDays(2, 5)
      expect(restDays).toHaveLength(2)
      expect(restDays).toContain(0) // Sunday
      expect(restDays).toContain(3) // Wednesday
    })

    it('should add Friday for 3 rest days', () => {
      const restDays = distributeRestDays(3, 4)
      expect(restDays).toHaveLength(3)
      expect(restDays).toContain(0) // Sunday
      expect(restDays).toContain(3) // Wednesday
      expect(restDays).toContain(5) // Friday
    })

    it('should distribute rest days evenly', () => {
      const restDays = distributeRestDays(2, 5)
      expect(restDays).toHaveLength(2)

      // Rest days should be sorted
      for (let i = 1; i < restDays.length; i++) {
        expect(restDays[i]).toBeGreaterThan(restDays[i - 1])
      }
    })

    it('should return correct number of rest days', () => {
      for (let restCount = 0; restCount <= 7; restCount++) {
        const restDays = distributeRestDays(restCount, 7 - restCount)
        expect(restDays).toHaveLength(restCount)
      }
    })
  })

  describe('generateMultiWeekPlan', () => {
    it('should generate correct number of weeks', () => {
      const goalAnalysis = createMockGoalAnalysis(4)
      const templates = [
        createMockTemplate('t1', 'cardio'),
        createMockTemplate('t2', 'strength'),
        createMockTemplate('t3', 'strength'),
      ]

      const plan = generateMultiWeekPlan(goalAnalysis, templates, 4)

      expect(plan).toHaveLength(4)
      expect(plan[0].week).toBe(1)
      expect(plan[3].week).toBe(4)
    })

    it('should create correct number of sessions per week', () => {
      const goalAnalysis = createMockGoalAnalysis(5)
      const templates = [
        createMockTemplate('t1', 'cardio'),
        createMockTemplate('t2', 'strength'),
        createMockTemplate('t3', 'strength'),
        createMockTemplate('t4', 'cardio'),
      ]

      const plan = generateMultiWeekPlan(goalAnalysis, templates, 2)

      for (const week of plan) {
        const workoutSessions = week.sessions.filter(s => s.workout_type !== 'rest')
        expect(workoutSessions.length).toBeLessThanOrEqual(5)
      }
    })

    it('should include rest days in schedule', () => {
      const goalAnalysis = createMockGoalAnalysis(4)
      const templates = [
        createMockTemplate('t1', 'cardio'),
        createMockTemplate('t2', 'strength'),
      ]

      const plan = generateMultiWeekPlan(goalAnalysis, templates, 1)

      // Should have 7 days (4 workout + 3 rest)
      expect(plan[0].sessions).toHaveLength(7)

      const restSessions = plan[0].sessions.filter(s => s.workout_type === 'rest')
      expect(restSessions).toHaveLength(3)
    })

    it('should assign unique day_of_week values', () => {
      const goalAnalysis = createMockGoalAnalysis(5)
      const templates = [
        createMockTemplate('t1', 'cardio'),
        createMockTemplate('t2', 'strength'),
        createMockTemplate('t3', 'strength'),
      ]

      const plan = generateMultiWeekPlan(goalAnalysis, templates, 1)

      const daysOfWeek = plan[0].sessions.map(s => s.day_of_week)
      const uniqueDays = new Set(daysOfWeek)

      expect(uniqueDays.size).toBe(7) // All 7 days should be present
    })

    it('should use different templates across days', () => {
      const goalAnalysis = createMockGoalAnalysis(5)
      const templates = [
        createMockTemplate('t1', 'cardio'),
        createMockTemplate('t2', 'strength'),
        createMockTemplate('t3', 'strength'),
        createMockTemplate('t4', 'cardio'),
      ]

      const plan = generateMultiWeekPlan(goalAnalysis, templates, 1)

      const workoutSessions = plan[0].sessions.filter(s => s.workout_type !== 'rest')
      const templateIds = workoutSessions.map(s => s.workout_template_id)

      // Should have variety (not all the same template)
      const uniqueTemplates = new Set(templateIds.filter(id => id !== null))
      expect(uniqueTemplates.size).toBeGreaterThan(1)
    })

    it('should set correct day names', () => {
      const goalAnalysis = createMockGoalAnalysis(4)
      const templates = [createMockTemplate('t1', 'strength')]

      const plan = generateMultiWeekPlan(goalAnalysis, templates, 1)

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

      for (const session of plan[0].sessions) {
        expect(dayNames[session.day_of_week]).toBe(session.day_name)
      }
    })

    it('should handle minimal templates gracefully', () => {
      const goalAnalysis = createMockGoalAnalysis(5)
      const templates = [createMockTemplate('t1', 'strength')]

      const plan = generateMultiWeekPlan(goalAnalysis, templates, 2)

      expect(plan).toHaveLength(2)

      // Should still generate full weeks even with limited templates
      for (const week of plan) {
        expect(week.sessions).toHaveLength(7)
      }
    })

    it('should increment week numbers correctly', () => {
      const goalAnalysis = createMockGoalAnalysis(4)
      const templates = [createMockTemplate('t1', 'strength')]

      const plan = generateMultiWeekPlan(goalAnalysis, templates, 5)

      for (let i = 0; i < plan.length; i++) {
        expect(plan[i].week).toBe(i + 1)

        // Each session should have correct week number
        for (const session of plan[i].sessions) {
          expect(session.week_number).toBe(i + 1)
        }
      }
    })

    it('should calculate estimated weekly volume', () => {
      const goalAnalysis = createMockGoalAnalysis(4)
      const templates = [
        createMockTemplate('t1', 'strength'),
        createMockTemplate('t2', 'cardio'),
      ]

      const plan = generateMultiWeekPlan(goalAnalysis, templates, 1)

      expect(plan[0].estimatedWeeklyVolume).toBeGreaterThan(0)
    })
  })
})
