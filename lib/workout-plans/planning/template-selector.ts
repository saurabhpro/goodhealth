/**
 * Template Selector - Selects appropriate workout templates based on goal analysis
 * Phase 2: Planning Engine
 */

import type { WorkoutTemplate, Exercise } from '@/types'
import type { GoalAnalysis } from './goal-analyzer'
import {
  getTemplateExercises,
  getTemplateMuscleGroups,
  getTemplateEstimatedDuration,
  getTemplateIntensity,
} from './template-helpers'

export interface TemplateScore {
  template: WorkoutTemplate
  score: number
  reasoning: string
}

/**
 * Calculates cardio ratio for a template (0 = all strength, 1 = all cardio)
 */
export function calculateCardioRatio(exercises: Exercise[]): number {
  if (!exercises || exercises.length === 0) return 0.5

  const cardioCount = exercises.filter(ex =>
    ex.exercise_type === 'cardio'
  ).length

  return cardioCount / exercises.length
}

/**
 * Calculates muscle group diversity score
 */
function calculateMuscleGroupDiversity(
  template: WorkoutTemplate,
  usedMuscleGroupsToday: Map<string, number>
): number {
  const muscleGroups = getTemplateMuscleGroups(template)

  // If no muscle groups specified, neutral score
  if (muscleGroups.length === 0) {
    return 0
  }

  let diversityScore = 0

  // Reward templates that target under-worked muscle groups
  for (const muscleGroup of muscleGroups) {
    const daysSinceWorked = usedMuscleGroupsToday.get(muscleGroup) || 99
    if (daysSinceWorked >= 2) {
      diversityScore += 10
    } else if (daysSinceWorked >= 1) {
      diversityScore += 5
    } else {
      diversityScore -= 15 // Penalty for working same muscle group
    }
  }

  return diversityScore / muscleGroups.length
}

/**
 * Scores a template based on how well it matches the goal analysis
 */
export function scoreTemplate(
  template: WorkoutTemplate,
  goalAnalysis: GoalAnalysis,
  usedThisWeek: Set<string>,
  usedMuscleGroupsToday: Map<string, number> = new Map()
): TemplateScore {
  let score = 0
  const reasons: string[] = []

  // Match workout type with goal (cardio vs strength)
  const exercises = getTemplateExercises(template)
  const templateCardioRatio = exercises.length > 0
    ? calculateCardioRatio(exercises)
    : 0.5
  const ratioMatch = 1 - Math.abs(templateCardioRatio - goalAnalysis.recommendations.cardioToStrengthRatio)
  const ratioScore = ratioMatch * 40
  score += ratioScore
  reasons.push(`Type match: ${ratioScore.toFixed(1)}`)

  // Match duration
  const templateDuration = getTemplateEstimatedDuration(template)
  const targetDuration = goalAnalysis.recommendations.avgDuration
  const durationDiff = Math.abs(templateDuration - targetDuration)
  const durationScore = durationDiff <= 15 ? 20 : (durationDiff <= 30 ? 10 : 5)
  score += durationScore
  reasons.push(`Duration match: ${durationScore}`)

  // Avoid repetition in the same week
  if (usedThisWeek.has(template.id)) {
    const repetitionPenalty = -30
    score += repetitionPenalty
    reasons.push(`Repetition penalty: ${repetitionPenalty}`)
  } else {
    reasons.push('No repetition: +0')
  }

  // Muscle group diversity
  const diversityScore = calculateMuscleGroupDiversity(template, usedMuscleGroupsToday)
  score += diversityScore
  reasons.push(`Muscle diversity: ${diversityScore.toFixed(1)}`)

  // Intensity match
  const templateIntensityLevel = getTemplateIntensity(template)
  const intensityMap = { beginner: 1, intermediate: 2, advanced: 3 }
  const goalIntensity = intensityMap[goalAnalysis.intensity]
  const intensityLevelMap = { low: 1, moderate: 2, high: 3, max: 3 }
  const templateIntensity = intensityLevelMap[templateIntensityLevel]

  if (Math.abs(goalIntensity - templateIntensity) <= 1) {
    score += 10
    reasons.push('Intensity match: +10')
  }

  return {
    template,
    score,
    reasoning: reasons.join(', '),
  }
}

/**
 * Selects the best template from available options
 */
export function selectTemplate(
  templates: WorkoutTemplate[],
  goalAnalysis: GoalAnalysis,
  usedThisWeek: Set<string>,
  usedMuscleGroupsToday: Map<string, number> = new Map()
): WorkoutTemplate | null {
  if (!templates || templates.length === 0) return null

  // Score all templates
  const scoredTemplates = templates
    .map(template => scoreTemplate(template, goalAnalysis, usedThisWeek, usedMuscleGroupsToday))
    .sort((a, b) => b.score - a.score)

  // Select from top 3 to add variety (randomization)
  const topTemplates = scoredTemplates.slice(0, Math.min(3, scoredTemplates.length))
  const selectedIndex = Math.floor(Math.random() * topTemplates.length)

  return topTemplates[selectedIndex].template
}

/**
 * Filters templates by cardio/strength preference
 */
export function filterTemplatesByType(
  templates: WorkoutTemplate[],
  preferCardio: boolean,
  threshold: number = 0.5
): WorkoutTemplate[] {
  return templates.filter(template => {
    const exercises = getTemplateExercises(template)
    const cardioRatio = exercises.length > 0
      ? calculateCardioRatio(exercises)
      : 0.5

    return preferCardio
      ? cardioRatio >= threshold
      : cardioRatio < threshold
  })
}

/**
 * Selects templates for a specific day with rotation logic
 */
export function selectTemplateWithRotation(
  templates: WorkoutTemplate[],
  goalAnalysis: GoalAnalysis,
  usedTemplatesThisWeek: Set<string>,
  usedMuscleGroups: Map<string, number>,
  dayOfWeek: number
): WorkoutTemplate | null {
  // Apply different strategies based on day of week
  let availableTemplates = [...templates]

  // Monday/Wednesday/Friday: Strength focus for muscle building
  // Tuesday/Thursday/Saturday: Can be cardio or mixed
  // Filter templates based on goal type and day of week
  if (goalAnalysis.goalType === 'muscle_building' && [1, 3, 5].includes(dayOfWeek)) {
    // Strength days for muscle building
    availableTemplates = filterTemplatesByType(templates, false, 0.5)
  } else if (goalAnalysis.goalType === 'weight_loss' && [2, 4, 6].includes(dayOfWeek)) {
    // Cardio days for weight loss
    availableTemplates = filterTemplatesByType(templates, true, 0.6)
  }

  // If filtering left us with no templates, use all
  if (availableTemplates.length === 0) {
    availableTemplates = templates
  }

  return selectTemplate(
    availableTemplates,
    goalAnalysis,
    usedTemplatesThisWeek,
    usedMuscleGroups
  )
}
