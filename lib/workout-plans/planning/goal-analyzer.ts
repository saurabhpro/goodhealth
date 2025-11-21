/**
 * Goal Analyzer - Analyzes user goals and generates planning strategies
 * Phase 2: Planning Engine
 */

import type { Goal, Workout } from '@/types'

export type GoalType = 'weight_loss' | 'muscle_building' | 'endurance' | 'general_fitness'
export type IntensityLevel = 'beginner' | 'intermediate' | 'advanced'

export interface GoalAnalysis {
  goalType: GoalType
  targetValue: number
  currentValue: number
  timeframe: number // days
  intensity: IntensityLevel

  recommendations: {
    workoutsPerWeek: number
    cardioToStrengthRatio: number // 0-1 (0=all strength, 1=all cardio)
    avgDuration: number // minutes
    restDaysPerWeek: number
  }
}

export interface WorkoutHistory {
  totalWorkouts: number
  lastWorkoutDate: string | null
  avgWorkoutsPerWeek: number
  experienceLevel: IntensityLevel
}

/**
 * Determines goal type based on goal metadata
 */
export function determineGoalType(goal: Goal): GoalType {
  const title = goal.title.toLowerCase()
  const description = (goal.description || '').toLowerCase()
  const text = `${title} ${description}`

  // Check for specific keywords
  if (text.includes('weight loss') || text.includes('lose weight') || text.includes('fat loss')) {
    return 'weight_loss'
  }

  if (text.includes('muscle') || text.includes('strength') || text.includes('bulk') || text.includes('gain')) {
    return 'muscle_building'
  }

  if (text.includes('endurance') || text.includes('cardio') || text.includes('marathon') || text.includes('running')) {
    return 'endurance'
  }

  // Default based on unit
  if (goal.unit === 'kg' || goal.unit === 'lbs') {
    const target = goal.target_value || 0
    const current = goal.current_value || 0
    return target < current ? 'weight_loss' : 'muscle_building'
  }

  return 'general_fitness'
}

/**
 * Calculates user's experience level based on workout history
 */
export function calculateIntensity(history: WorkoutHistory): IntensityLevel {
  const { totalWorkouts, avgWorkoutsPerWeek } = history

  if (totalWorkouts < 10 || avgWorkoutsPerWeek < 2) {
    return 'beginner'
  }

  if (totalWorkouts < 50 || avgWorkoutsPerWeek < 4) {
    return 'intermediate'
  }

  return 'advanced'
}

/**
 * Analyzes workout history to calculate statistics
 */
export function analyzeWorkoutHistory(workouts: Workout[]): WorkoutHistory {
  if (!workouts || workouts.length === 0) {
    return {
      totalWorkouts: 0,
      lastWorkoutDate: null,
      avgWorkoutsPerWeek: 0,
      experienceLevel: 'beginner',
    }
  }

  const sortedWorkouts = [...workouts].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const lastWorkoutDate = sortedWorkouts[0]?.date || null
  const totalWorkouts = workouts.length

  // Calculate average workouts per week (last 90 days)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const recentWorkouts = workouts.filter(w =>
    new Date(w.date) >= ninetyDaysAgo
  )

  const avgWorkoutsPerWeek = (recentWorkouts.length / 90) * 7

  const experienceLevel = calculateIntensity({
    totalWorkouts,
    lastWorkoutDate,
    avgWorkoutsPerWeek,
    experienceLevel: 'beginner', // Will be calculated
  })

  return {
    totalWorkouts,
    lastWorkoutDate,
    avgWorkoutsPerWeek,
    experienceLevel,
  }
}

/**
 * Gets planning recommendations based on goal type and intensity
 */
function getRecommendations(
  goalType: GoalType,
  intensity: IntensityLevel
): GoalAnalysis['recommendations'] {
  const baseRecommendations: Record<GoalType, GoalAnalysis['recommendations']> = {
    weight_loss: {
      workoutsPerWeek: 5,
      cardioToStrengthRatio: 0.7,
      avgDuration: 45,
      restDaysPerWeek: 2,
    },
    muscle_building: {
      workoutsPerWeek: 4,
      cardioToStrengthRatio: 0.2,
      avgDuration: 60,
      restDaysPerWeek: 3,
    },
    endurance: {
      workoutsPerWeek: 5,
      cardioToStrengthRatio: 0.8,
      avgDuration: 50,
      restDaysPerWeek: 2,
    },
    general_fitness: {
      workoutsPerWeek: 4,
      cardioToStrengthRatio: 0.5,
      avgDuration: 45,
      restDaysPerWeek: 3,
    },
  }

  const recommendations = { ...baseRecommendations[goalType] }

  // Adjust for intensity level
  if (intensity === 'beginner') {
    recommendations.workoutsPerWeek = Math.max(3, recommendations.workoutsPerWeek - 1)
    recommendations.avgDuration = Math.max(30, recommendations.avgDuration - 15)
    recommendations.restDaysPerWeek = Math.min(4, recommendations.restDaysPerWeek + 1)
  } else if (intensity === 'advanced') {
    recommendations.workoutsPerWeek = Math.min(6, recommendations.workoutsPerWeek + 1)
    recommendations.avgDuration = Math.min(75, recommendations.avgDuration + 10)
    recommendations.restDaysPerWeek = Math.max(1, recommendations.restDaysPerWeek - 1)
  }

  return recommendations
}

/**
 * Main function: Analyzes a goal and generates planning strategy
 */
export function analyzeGoal(
  goal: Goal,
  workoutHistory: WorkoutHistory
): GoalAnalysis {
  const goalType = determineGoalType(goal)
  const intensity = workoutHistory.experienceLevel

  const targetValue = goal.target_value || 0
  const currentValue = goal.current_value || 0

  // Calculate timeframe in days
  const now = new Date()
  const deadline = goal.target_date ? new Date(goal.target_date) : new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // Default 90 days
  const timeframe = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  const recommendations = getRecommendations(goalType, intensity)

  return {
    goalType,
    targetValue,
    currentValue,
    timeframe,
    intensity,
    recommendations,
  }
}
