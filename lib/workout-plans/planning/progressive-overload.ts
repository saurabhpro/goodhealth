/**
 * Progressive Overload Calculator - Calculates workout progression over weeks
 * Phase 2: Planning Engine
 */

import type { Exercise } from '@/types'
import type { GoalType } from './goal-analyzer'

export interface ProgressionWeek {
  week: number
  sets: number
  reps: number
  weight: number
  restSeconds: number
}

export interface ProgressionPlan {
  exercise: Exercise
  weeks: ProgressionWeek[]
}

export interface ProgressionStrategy {
  weightIncrease: number // Percentage increase per week
  repRange: [number, number]
  setIncrease: number // Number of sets to add per week
  restPeriod: number // Seconds
}

/**
 * Gets progression strategy based on goal type
 */
export function getProgressionStrategy(goalType: GoalType): ProgressionStrategy {
  switch (goalType) {
    case 'muscle_building':
      return {
        weightIncrease: 0.025, // 2.5% per week
        repRange: [8, 12],
        setIncrease: 0,
        restPeriod: 90,
      }

    case 'endurance':
      return {
        weightIncrease: 0,
        repRange: [15, 20],
        setIncrease: 0.5, // Gradually add sets
        restPeriod: 45,
      }

    case 'weight_loss':
      return {
        weightIncrease: 0,
        repRange: [12, 15],
        setIncrease: 0,
        restPeriod: 30,
      }

    case 'general_fitness':
      return {
        weightIncrease: 0.02,
        repRange: [10, 12],
        setIncrease: 0,
        restPeriod: 60,
      }
  }
}

/**
 * Applies progression strategy to an exercise for a specific week
 */
function applyProgressionStrategy(
  exercise: Exercise,
  weekNumber: number,
  strategy: ProgressionStrategy
): ProgressionWeek {
  const baseWeek = weekNumber - 1 // 0-indexed for multiplier

  // Calculate sets
  const baseSets = exercise.sets || 3
  const additionalSets = Math.floor(baseWeek * strategy.setIncrease)
  const sets = Math.min(baseSets + additionalSets, 6) // Cap at 6 sets

  // Calculate reps
  const baseReps = exercise.reps || strategy.repRange[0]
  const reps = Math.min(Math.max(baseReps, strategy.repRange[0]), strategy.repRange[1])

  // Calculate weight (progressive overload)
  const baseWeight = exercise.weight || 0
  const weightMultiplier = 1 + (strategy.weightIncrease * baseWeek)
  const weight = baseWeight > 0 ? Math.round(baseWeight * weightMultiplier * 2) / 2 : 0 // Round to nearest 0.5

  return {
    week: weekNumber,
    sets,
    reps,
    weight,
    restSeconds: strategy.restPeriod,
  }
}

/**
 * Calculates progression plan for an exercise over multiple weeks
 */
export function calculateProgression(
  exercise: Exercise,
  totalWeeks: number,
  goalType: GoalType
): ProgressionPlan {
  const strategy = getProgressionStrategy(goalType)
  const weeks: ProgressionWeek[] = []

  for (let week = 1; week <= totalWeeks; week++) {
    const progression = applyProgressionStrategy(exercise, week, strategy)
    weeks.push(progression)
  }

  return {
    exercise,
    weeks,
  }
}

/**
 * Applies progressive overload to exercises in a session based on week number
 */
export function applyProgressiveOverload(
  exercises: Exercise[],
  weekNumber: number,
  goalType: GoalType
): Exercise[] {
  const strategy = getProgressionStrategy(goalType)

  return exercises.map(exercise => {
    // Skip cardio exercises
    if (exercise.exercise_type === 'cardio') {
      return exercise
    }

    const progression = applyProgressionStrategy(exercise, weekNumber, strategy)

    return {
      ...exercise,
      sets: progression.sets,
      reps: progression.reps,
      weight: progression.weight,
      rest_seconds: progression.restSeconds,
    }
  })
}

/**
 * Calculates deload week (reduced volume/intensity for recovery)
 * Typically every 4th or 5th week
 */
export function isDeloadWeek(weekNumber: number, deloadFrequency: number = 4): boolean {
  return weekNumber % deloadFrequency === 0
}

/**
 * Applies deload adjustments to exercises
 */
export function applyDeload(exercises: Exercise[]): Exercise[] {
  return exercises.map(exercise => {
    if (exercise.exercise_type === 'cardio') {
      return exercise
    }

    return {
      ...exercise,
      sets: exercise.sets ? Math.max(1, exercise.sets - 1) : 2,
      weight: exercise.weight ? Math.round(exercise.weight * 0.7 * 2) / 2 : 0, // 70% of working weight
    }
  })
}

/**
 * Calculates total volume for a set of exercises
 */
export function calculateVolume(exercises: Exercise[]): number {
  return exercises.reduce((total, exercise) => {
    if (exercise.exercise_type === 'cardio') return total

    const sets = exercise.sets || 0
    const reps = exercise.reps || 0
    const weight = exercise.weight || 0

    return total + (sets * reps * weight)
  }, 0)
}

/**
 * Generates progression summary for a plan
 */
export function generateProgressionSummary(
  initialVolume: number,
  finalVolume: number,
  weeks: number
): {
  volumeIncrease: number
  weeklyIncreaseRate: number
  totalIncreasePercentage: number
} {
  const volumeIncrease = finalVolume - initialVolume
  const weeklyIncreaseRate = volumeIncrease / weeks
  const totalIncreasePercentage = ((finalVolume - initialVolume) / initialVolume) * 100

  return {
    volumeIncrease,
    weeklyIncreaseRate,
    totalIncreasePercentage: Math.round(totalIncreasePercentage * 10) / 10,
  }
}
