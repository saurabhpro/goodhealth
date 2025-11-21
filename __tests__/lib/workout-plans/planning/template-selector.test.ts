/**
 * Unit tests for template selector
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { scoreTemplate, selectTemplates } from '@/lib/workout-plans/planning/template-selector'
import type { WorkoutTemplate } from '@/types'
import type { GoalAnalysis } from '@/lib/workout-plans/planning/goal-analyzer'

// Mock goal analysis
const createMockGoalAnalysis = (goalType: string, cardioRatio: number): GoalAnalysis => ({
  goalType: goalType as any,
  targetValue: 100,
  currentValue: 80,
  timeframe: 90,
  intensity: 'intermediate',
  recommendations: {
    workoutsPerWeek: 4,
    cardioToStrengthRatio: cardioRatio,
    avgDuration: 60,
    restDaysPerWeek: 3,
  },
})

// Mock workout template
const createMockTemplate = (
  id: string,
  type: 'cardio' | 'strength',
  duration: number = 60
): WorkoutTemplate => ({
  id,
  user_id: 'user1',
  name: `${type} Template ${id}`,
  description: `A ${type} workout`,
  estimated_duration: duration,
  exercises: type === 'cardio'
    ? [
        { exercise_type: 'cardio' as const, name: 'Running', duration: 1800, sets: null, reps: null, weight: null }
      ]
    : [
        { exercise_type: 'strength' as const, name: 'Bench Press', sets: 3, reps: 10, weight: 60 }
      ],
  is_public: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

describe('Template Selector', () => {
  describe('scoreTemplate', () => {
    it('should score cardio templates higher for weight loss goals', () => {
      const goalAnalysis = createMockGoalAnalysis('weight_loss', 0.7)
      const cardioTemplate = createMockTemplate('c1', 'cardio')
      const strengthTemplate = createMockTemplate('s1', 'strength')

      const cardioScore = scoreTemplate(cardioTemplate, goalAnalysis, new Set())
      const strengthScore = scoreTemplate(strengthTemplate, goalAnalysis, new Set())

      expect(cardioScore).toBeGreaterThan(strengthScore)
    })

    it('should score strength templates higher for muscle building goals', () => {
      const goalAnalysis = createMockGoalAnalysis('muscle_building', 0.2)
      const cardioTemplate = createMockTemplate('c1', 'cardio')
      const strengthTemplate = createMockTemplate('s1', 'strength')

      const cardioScore = scoreTemplate(cardioTemplate, goalAnalysis, new Set())
      const strengthScore = scoreTemplate(strengthTemplate, goalAnalysis, new Set())

      expect(strengthScore).toBeGreaterThan(cardioScore)
    })

    it('should penalize recently used templates', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const template = createMockTemplate('t1', 'strength')

      const unusedScore = scoreTemplate(template, goalAnalysis, new Set())
      const usedScore = scoreTemplate(template, goalAnalysis, new Set(['t1']))

      expect(unusedScore).toBeGreaterThan(usedScore)
    })

    it('should prefer templates matching target duration', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const shortTemplate = createMockTemplate('t1', 'strength', 30)
      const matchingTemplate = createMockTemplate('t2', 'strength', 60)
      const longTemplate = createMockTemplate('t3', 'strength', 120)

      const shortScore = scoreTemplate(shortTemplate, goalAnalysis, new Set())
      const matchingScore = scoreTemplate(matchingTemplate, goalAnalysis, new Set())
      const longScore = scoreTemplate(longTemplate, goalAnalysis, new Set())

      expect(matchingScore).toBeGreaterThan(shortScore)
      expect(matchingScore).toBeGreaterThan(longScore)
    })

    it('should return score between 0 and 100', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const template = createMockTemplate('t1', 'strength')

      const score = scoreTemplate(template, goalAnalysis, new Set())

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('selectTemplates', () => {
    it('should select requested number of templates', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const templates = [
        createMockTemplate('t1', 'cardio'),
        createMockTemplate('t2', 'strength'),
        createMockTemplate('t3', 'cardio'),
        createMockTemplate('t4', 'strength'),
        createMockTemplate('t5', 'strength'),
      ]

      const selected = selectTemplates(templates, goalAnalysis, 3)

      expect(selected).toHaveLength(3)
    })

    it('should return all templates if count exceeds available', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const templates = [
        createMockTemplate('t1', 'cardio'),
        createMockTemplate('t2', 'strength'),
      ]

      const selected = selectTemplates(templates, goalAnalysis, 5)

      expect(selected).toHaveLength(2)
    })

    it('should select appropriate mix for weight loss', () => {
      const goalAnalysis = createMockGoalAnalysis('weight_loss', 0.7)
      const templates = [
        createMockTemplate('c1', 'cardio'),
        createMockTemplate('c2', 'cardio'),
        createMockTemplate('s1', 'strength'),
        createMockTemplate('s2', 'strength'),
      ]

      const selected = selectTemplates(templates, goalAnalysis, 4)

      const cardioCount = selected.filter(t =>
        t.exercises.some(e => e.exercise_type === 'cardio')
      ).length
      const strengthCount = selected.filter(t =>
        t.exercises.some(e => e.exercise_type === 'strength')
      ).length

      // Should prefer cardio for weight loss
      expect(cardioCount).toBeGreaterThanOrEqual(strengthCount)
    })

    it('should select appropriate mix for muscle building', () => {
      const goalAnalysis = createMockGoalAnalysis('muscle_building', 0.2)
      const templates = [
        createMockTemplate('c1', 'cardio'),
        createMockTemplate('c2', 'cardio'),
        createMockTemplate('s1', 'strength'),
        createMockTemplate('s2', 'strength'),
        createMockTemplate('s3', 'strength'),
      ]

      const selected = selectTemplates(templates, goalAnalysis, 4)

      const cardioCount = selected.filter(t =>
        t.exercises.some(e => e.exercise_type === 'cardio')
      ).length
      const strengthCount = selected.filter(t =>
        t.exercises.some(e => e.exercise_type === 'strength')
      ).length

      // Should prefer strength for muscle building
      expect(strengthCount).toBeGreaterThan(cardioCount)
    })

    it('should handle empty template list', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const selected = selectTemplates([], goalAnalysis, 3)

      expect(selected).toHaveLength(0)
    })

    it('should not select duplicate templates', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const templates = [
        createMockTemplate('t1', 'cardio'),
        createMockTemplate('t2', 'strength'),
        createMockTemplate('t3', 'cardio'),
      ]

      const selected = selectTemplates(templates, goalAnalysis, 3)
      const ids = selected.map(t => t.id)
      const uniqueIds = new Set(ids)

      expect(ids.length).toBe(uniqueIds.size)
    })
  })
})
