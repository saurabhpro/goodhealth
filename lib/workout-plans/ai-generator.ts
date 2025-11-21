/**
 * AI-Powered Workout Plan Generator using Google Gemini 2.5 Pro
 * Generates personalized workout plans based on user preferences, history, and goals
 */

'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  UserWorkoutPreferences,
  UserWorkoutTemplate,
  Goal,
  Workout,
} from '@/types'

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface UserProfile {
  dateOfBirth?: string
  gender?: string
  heightCm?: number
  fitnessLevel?: string
  medicalConditions?: string
  injuries?: string
}

export interface LatestMeasurements {
  weight?: number
  bodyFatPercentage?: number
  muscleMass?: number
  measurementDate?: string
}

export interface AIGenerationRequest {
  goal: Goal
  preferences?: UserWorkoutPreferences
  workoutHistory?: Workout[]
  userTemplates?: UserWorkoutTemplate[]
  userProfile?: UserProfile
  latestMeasurements?: LatestMeasurements
  planConfig: {
    weeksCount: number
    workoutsPerWeek: number
    avgDuration: number
  }
}

export interface AIGeneratedPlanResponse {
  success: boolean
  plan?: {
    weeklySchedule: WeeklyWorkout[]
    rationale: string
    progressionStrategy: string
    keyConsiderations: string[]
  }
  error?: string
}

export interface WeeklyWorkout {
  week: number
  day: number
  dayName: string
  workoutType: string
  exercises: ExerciseDetail[]
  duration: number
  intensity: 'low' | 'medium' | 'high'
  notes?: string
}

export interface ExerciseDetail {
  name: string
  sets: number
  reps: number
  weight?: number
  weightUnit?: string
  restSeconds?: number
  notes?: string
}

/**
 * Generate a workout plan using Gemini 2.5 Pro
 */
export async function generateWorkoutPlanWithAI(
  request: AIGenerationRequest
): Promise<AIGeneratedPlanResponse> {
  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        error: 'Gemini API key not configured. Please add GEMINI_API_KEY to environment variables.',
      }
    }

    // Build the prompt
    const prompt = buildPrompt(request)

    // Call Gemini 2.5 Pro
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro', // Using Gemini 2.5 Pro - most capable model
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7, // Balanced creativity and consistency
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16000, // Allow for detailed plans (increased from 8000)
      },
    })

    const response = result.response
    const text = response.text()

    // Log the response for debugging
    console.log('AI Response length:', text.length)
    console.log('AI Response preview:', text.substring(0, 200))

    // Parse the AI response
    const parsedPlan = parseAIResponse(text)

    // Check if we got valid data
    if (!parsedPlan.weeklySchedule || parsedPlan.weeklySchedule.length === 0) {
      console.error('AI returned empty weekly schedule')
      return {
        success: false,
        error: 'AI did not generate any workout sessions. Please try again.',
      }
    }

    return {
      success: true,
      plan: parsedPlan,
    }
  } catch (error) {
    console.error('Error generating AI workout plan:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate workout plan with AI',
    }
  }
}

/**
 * Build the prompt for Gemini
 */
function buildPrompt(request: AIGenerationRequest): string {
  const { goal, preferences, workoutHistory, userTemplates, userProfile, latestMeasurements, planConfig } = request

  let prompt = `You are an expert fitness coach and workout planner. Generate a personalized workout plan based on the following information.

## User Goal
- **Title**: ${goal.title}
- **Description**: ${goal.description || 'Not specified'}
- **Target**: ${goal.target_value} ${goal.unit}
- **Current**: ${goal.current_value} ${goal.unit}
- **Target Date**: ${goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'Not specified'}

## Plan Requirements
- **Duration**: ${planConfig.weeksCount} weeks
- **Workouts per Week**: ${planConfig.workoutsPerWeek}
- **Average Session Duration**: ${planConfig.avgDuration} minutes
`

  // Add user profile information
  if (userProfile) {
    prompt += `\n## User Profile\n`

    if (userProfile.dateOfBirth) {
      const age = calculateAge(userProfile.dateOfBirth)
      prompt += `- **Age**: ${age} years\n`
    }

    if (userProfile.gender) {
      prompt += `- **Gender**: ${userProfile.gender}\n`
    }

    if (userProfile.heightCm) {
      prompt += `- **Height**: ${userProfile.heightCm} cm\n`
    }

    if (userProfile.fitnessLevel) {
      prompt += `- **Fitness Level**: ${userProfile.fitnessLevel}\n`
    }

    if (userProfile.medicalConditions) {
      prompt += `- **Medical Conditions**: ${userProfile.medicalConditions}\n`
    }

    if (userProfile.injuries) {
      prompt += `- **Injuries/Limitations**: ${userProfile.injuries}\n`
    }
  }

  // Add latest measurements
  if (latestMeasurements && latestMeasurements.weight) {
    prompt += `\n## Current Body Metrics (as of ${latestMeasurements.measurementDate ? new Date(latestMeasurements.measurementDate).toLocaleDateString() : 'latest'})\n`
    prompt += `- **Weight**: ${latestMeasurements.weight} kg\n`

    if (latestMeasurements.bodyFatPercentage) {
      prompt += `- **Body Fat**: ${latestMeasurements.bodyFatPercentage}%\n`
    }

    if (latestMeasurements.muscleMass) {
      prompt += `- **Muscle Mass**: ${latestMeasurements.muscleMass} kg\n`
    }

    // Calculate BMI if we have height
    if (userProfile?.heightCm && latestMeasurements.weight) {
      const heightM = userProfile.heightCm / 100
      const bmi = latestMeasurements.weight / (heightM * heightM)
      prompt += `- **BMI**: ${bmi.toFixed(1)}\n`
    }
  }

  // Add user preferences if available
  if (preferences) {
    prompt += `
## User Preferences
- **Fitness Level**: ${preferences.fitness_level || 'intermediate'}
- **Preferred Duration**: ${preferences.preferred_duration || 60} minutes (Min: ${preferences.min_duration || 30}, Max: ${preferences.max_duration || 90})
- **Focus Areas**: ${preferences.focus_areas?.join(', ') || 'Full body'}
- **Available Equipment**: ${preferences.available_equipment?.join(', ') || 'Full gym access'}
- **Gym Access**: ${preferences.gym_access ? 'Yes' : 'Home workouts only'}
`

    if (preferences.constraints) {
      prompt += `- **Constraints/Injuries**: ${preferences.constraints}\n`
    }

    if (preferences.preferred_time_of_day) {
      prompt += `- **Preferred Time**: ${preferences.preferred_time_of_day}\n`
    }

    if (preferences.preferred_days && preferences.preferred_days.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const preferredDayNames = preferences.preferred_days.map(d => dayNames[d]).join(', ')
      prompt += `- **Preferred Days**: ${preferredDayNames}\n`
    }
  }

  // Add workout history with exercise-specific weights
  if (workoutHistory && workoutHistory.length > 0) {
    const exerciseStats = analyzeExerciseHistory(workoutHistory)

    prompt += `
## Recent Workout History (Last 30 Days)
User has completed ${workoutHistory.length} workout(s) in the past 30 days.
`

    if (exerciseStats.size > 0) {
      prompt += `\n### Exercise Performance Data (Use these as baseline for recommendations):\n`
      exerciseStats.forEach((stats, exerciseName) => {
        prompt += `- **${exerciseName}**: Max weight ${stats.maxWeight} ${stats.weightUnit}, Average ${stats.avgWeight.toFixed(1)} ${stats.weightUnit} (${stats.totalSets} sets performed)\n`
      })

      prompt += `\n**IMPORTANT**: When prescribing weights for exercises the user has done before, use their historical data as a baseline. You can recommend:\n`
      prompt += `- Same weight for maintenance or if focusing on form/endurance\n`
      prompt += `- 5-10% more for progressive overload and strength gains\n`
      prompt += `- Slightly less if increasing volume (sets/reps) significantly\n`
    }
  }

  // Add user templates if available
  if (userTemplates && userTemplates.length > 0) {
    prompt += `
## User's Custom Templates
The user has ${userTemplates.length} custom workout template(s). Consider incorporating similar exercises they prefer.
`
  }

  // Instructions for output format
  prompt += `
## Instructions
Create a detailed ${planConfig.weeksCount}-week workout plan with ${planConfig.workoutsPerWeek} workouts per week.

**Important Requirements:**
1. Respect all constraints and injuries mentioned
2. Match the user's fitness level
3. Focus on the user's goal (${goal.title})
4. Include progressive overload across weeks
5. Each workout should have 4-6 exercises maximum (keep it concise)
6. Provide specific exercises with sets, reps, and weights
7. **Schedule workouts with balanced rest periods** - avoid back-to-back intense workouts:
   - For ${planConfig.workoutsPerWeek} workouts/week, spread them evenly (e.g., Mon/Wed/Fri/Sat for 4 days)
   - Allow at least 1 rest day between intense strength sessions targeting the same muscle groups
   - Active recovery or cardio can be scheduled between strength days
   - Consider user's preferred days if specified
8. Be concise - quality over quantity

**Output Format (STRICT JSON):**
\`\`\`json
{
  "weeklySchedule": [
    {
      "week": 1,
      "day": 1,
      "dayName": "Monday",
      "workoutType": "Upper Body Strength",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": 10,
          "weight": 60,
          "weightUnit": "kg",
          "restSeconds": 90,
          "notes": "Focus on controlled descent"
        }
      ],
      "duration": 60,
      "intensity": "medium",
      "notes": "Week 1 introduction - focus on form"
    }
  ],
  "rationale": "Explain why this plan suits the user's goal and fitness level...",
  "progressionStrategy": "Explain how the plan progresses week by week...",
  "keyConsiderations": ["Point 1", "Point 2", "Point 3"]
}
\`\`\`

**CRITICAL:** Keep the JSON response concise:
- 4-6 exercises per workout maximum
- Brief notes (one sentence max)
- Focus on quality over quantity

Generate a safe and effective workout plan. Return ONLY the JSON object, no additional text or explanation.`

  return prompt
}

/**
 * Calculate age from date of birth
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
 */
function analyzeExerciseHistory(workouts: Workout[]): Map<string, {
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

  // Aggregate exercise data from all workouts
  workouts.forEach(workout => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workoutData = workout as any
    if (workoutData.exercises && Array.isArray(workoutData.exercises)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workoutData.exercises.forEach((exercise: any) => {
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

  // Calculate stats for each exercise
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

/**
 * Parse the AI response into structured format
 */
function parseAIResponse(
  text: string
): {
  weeklySchedule: WeeklyWorkout[]
  rationale: string
  progressionStrategy: string
  keyConsiderations: string[]
} {
  try {
    // Extract JSON from code blocks if present
    let jsonText = text.trim()

    // Remove markdown code blocks
    // Pattern 1: ```json\n{...}\n```
    // Pattern 2: ```\n{...}\n```
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim()
    }

    // Remove any remaining backticks at start/end
    jsonText = jsonText.replace(/^`+|`+$/g, '').trim()

    // Remove "json" word if it appears at the start
    if (jsonText.startsWith('json')) {
      jsonText = jsonText.substring(4).trim()
    }

    const parsed = JSON.parse(jsonText)

    return {
      weeklySchedule: parsed.weeklySchedule || [],
      rationale: parsed.rationale || 'AI-generated workout plan based on your preferences.',
      progressionStrategy: parsed.progressionStrategy || 'Progressive overload will be applied weekly.',
      keyConsiderations: parsed.keyConsiderations || [],
    }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    console.error('Failed to parse text (first 500 chars):', text.substring(0, 500))
    console.error('Failed to parse text (last 500 chars):', text.substring(Math.max(0, text.length - 500)))

    // Fallback: return a basic structure
    return {
      weeklySchedule: [],
      rationale: 'Unable to parse AI response. Please try again.',
      progressionStrategy: 'N/A',
      keyConsiderations: ['Failed to generate plan', 'Please try again or use template-based generation'],
    }
  }
}
