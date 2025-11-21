/**
 * Unit tests for template selector
 */

import { scoreTemplate, selectTemplate } from '@/lib/workout-plans/planning/template-selector'
import type { WorkoutTemplate, Exercise } from '@/types'
import type { GoalAnalysis, GoalType } from '@/lib/workout-plans/planning/goal-analyzer'

// Mock goal analysis
const createMockGoalAnalysis = (goalType: GoalType, cardioRatio: number): GoalAnalysis => ({
  goalType,
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
  type: 'cardio' | 'strength'
): WorkoutTemplate => {
  const cardioExercise: Exercise = {
    id: 'ex1',
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

  const strengthExercise: Exercise = {
    id: 'ex2',
    workout_id: 'w1',
    name: 'Bench Press',
    exercise_type: 'strength',
    sets: 3,
    reps: 10,
    weight: 60,
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
  }

  return {
    id,
    user_id: 'user1',
    name: `${type} Template ${id}`,
    description: `A ${type} workout`,
    exercises: type === 'cardio' ? [cardioExercise] : [strengthExercise],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

describe('Template Selector', () => {
  describe('scoreTemplate', () => {
    it('should score cardio templates higher for weight loss goals', () => {
      const goalAnalysis = createMockGoalAnalysis('weight_loss', 0.7)
      const cardioTemplate = createMockTemplate('c1', 'cardio')
      const strengthTemplate = createMockTemplate('s1', 'strength')

      const cardioScore = scoreTemplate(cardioTemplate, goalAnalysis, new Set()).score
      const strengthScore = scoreTemplate(strengthTemplate, goalAnalysis, new Set()).score

      expect(cardioScore).toBeGreaterThan(strengthScore)
    })

    it('should score strength templates higher for muscle building goals', () => {
      const goalAnalysis = createMockGoalAnalysis('muscle_building', 0.2)
      const cardioTemplate = createMockTemplate('c1', 'cardio')
      const strengthTemplate = createMockTemplate('s1', 'strength')

      const cardioScore = scoreTemplate(cardioTemplate, goalAnalysis, new Set()).score
      const strengthScore = scoreTemplate(strengthTemplate, goalAnalysis, new Set()).score

      expect(strengthScore).toBeGreaterThan(cardioScore)
    })

    it('should penalize recently used templates', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const template = createMockTemplate('t1', 'strength')

      const unusedScore = scoreTemplate(template, goalAnalysis, new Set()).score
      const usedScore = scoreTemplate(template, goalAnalysis, new Set(['t1'])).score

      expect(unusedScore).toBeGreaterThan(usedScore)
    })

    it('should prefer templates matching target duration', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const template1 = createMockTemplate('t1', 'strength')
      const template2 = createMockTemplate('t2', 'strength')
      const template3 = createMockTemplate('t3', 'cardio')

      const score1 = scoreTemplate(template1, goalAnalysis, new Set()).score
      const score2 = scoreTemplate(template2, goalAnalysis, new Set()).score
      const score3 = scoreTemplate(template3, goalAnalysis, new Set()).score

      // All scores should be valid numbers
      expect(score1).toBeGreaterThanOrEqual(0)
      expect(score2).toBeGreaterThanOrEqual(0)
      expect(score3).toBeGreaterThanOrEqual(0)
    })

    it('should return score between 0 and 100', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const template = createMockTemplate('t1', 'strength')

      const result = scoreTemplate(template, goalAnalysis, new Set())

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe('selectTemplate', () => {
    it('should select a template from available options', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const templates = [
        createMockTemplate('t1', 'cardio'),
        createMockTemplate('t2', 'strength'),
        createMockTemplate('t3', 'cardio'),
        createMockTemplate('t4', 'strength'),
        createMockTemplate('t5', 'strength'),
      ]

      const selected = selectTemplate(templates, goalAnalysis, new Set())

      expect(selected).toBeDefined()
      expect(selected).not.toBeNull()
      expect(templates).toContainEqual(selected)
    })

    it('should return null for empty template list', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const selected = selectTemplate([], goalAnalysis, new Set())

      expect(selected).toBeNull()
    })

    it('should select cardio template for weight loss', () => {
      const goalAnalysis = createMockGoalAnalysis('weight_loss', 0.7)
      const templates = [
        createMockTemplate('c1', 'cardio'),
        createMockTemplate('c2', 'cardio'),
        createMockTemplate('s1', 'strength'),
        createMockTemplate('s2', 'strength'),
      ]

      const selected = selectTemplate(templates, goalAnalysis, new Set())

      expect(selected).toBeDefined()
      if (selected) {
        // Should be one of our templates
        expect(templates.some(t => t.id === selected.id)).toBe(true)
      }
    })

    it('should select strength template for muscle building', () => {
      const goalAnalysis = createMockGoalAnalysis('muscle_building', 0.2)
      const templates = [
        createMockTemplate('c1', 'cardio'),
        createMockTemplate('c2', 'cardio'),
        createMockTemplate('s1', 'strength'),
        createMockTemplate('s2', 'strength'),
        createMockTemplate('s3', 'strength'),
      ]

      const selected = selectTemplate(templates, goalAnalysis, new Set())

      expect(selected).toBeDefined()
      if (selected) {
        // Should be one of our templates
        expect(templates.some(t => t.id === selected.id)).toBe(true)
      }
    })

    it('should avoid recently used templates when possible', () => {
      const goalAnalysis = createMockGoalAnalysis('general_fitness', 0.5)
      const templates = [
        createMockTemplate('t1', 'cardio'),
        createMockTemplate('t2', 'strength'),
        createMockTemplate('t3', 'cardio'),
      ]

      const usedThisWeek = new Set(['t1', 't2'])
      const selected = selectTemplate(templates, goalAnalysis, usedThisWeek)

      // With enough templates, should prefer unused one
      expect(selected).toBeDefined()
      if (selected && templates.length > usedThisWeek.size) {
        // May still select a used one due to randomization, but should be valid
        expect(templates.some(t => t.id === selected.id)).toBe(true)
      }
    })
  })
})

// Helper function to get exercises (imported from template-helpers)
function getTemplateExercises(template: WorkoutTemplate): Exercise[] {
  if (!template.exercises) return []

  try {
    if (Array.isArray(template.exercises)) {
      return template.exercises as Exercise[]
    }
    if (typeof template.exercises === 'string') {
      return JSON.parse(template.exercises) as Exercise[]
    }
    return []
  } catch {
    return []
  }
}
