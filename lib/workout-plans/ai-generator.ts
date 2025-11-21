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

export interface AIGenerationRequest {
  goal: Goal
  preferences?: UserWorkoutPreferences
  workoutHistory?: Workout[]
  userTemplates?: UserWorkoutTemplate[]
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
      model: 'gemini-2.5-pro', // Using Gemini 2.5 Pro (stable, latest)
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7, // Balanced creativity and consistency
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8000, // Allow for detailed plans
      },
    })

    const response = result.response
    const text = response.text()

    // Parse the AI response
    const parsedPlan = parseAIResponse(text)

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
  const { goal, preferences, workoutHistory, userTemplates, planConfig } = request

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

  // Add workout history context
  if (workoutHistory && workoutHistory.length > 0) {
    prompt += `
## Recent Workout History
User has completed ${workoutHistory.length} workouts recently. Latest workouts show focus on: ${extractWorkoutPatterns(workoutHistory)}
`
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
5. Provide specific exercises with sets, reps, and weights
6. Include rest days strategically
7. Vary workouts to prevent monotony
8. Consider recovery and avoid overtraining

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

Generate a comprehensive, safe, and effective workout plan. Return ONLY the JSON object, no additional text.`

  return prompt
}

/**
 * Extract workout patterns from history
 */
function extractWorkoutPatterns(workouts: Workout[]): string {
  const recentWorkouts = workouts.slice(0, 5)
  const workoutNames = recentWorkouts.map(w => w.name).join(', ')
  return workoutNames || 'varied training'
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
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/
    const codeBlockRegex = /```\s*([\s\S]*?)\s*```/
    const jsonMatch = jsonRegex.exec(text) || codeBlockRegex.exec(text)
    let jsonText = jsonMatch ? jsonMatch[1] : text

    // Additional cleanup: remove any remaining backticks
    jsonText = jsonText.trim().replace(/^`+|`+$/g, '')

    const parsed = JSON.parse(jsonText)

    return {
      weeklySchedule: parsed.weeklySchedule || [],
      rationale: parsed.rationale || 'AI-generated workout plan based on your preferences.',
      progressionStrategy: parsed.progressionStrategy || 'Progressive overload will be applied weekly.',
      keyConsiderations: parsed.keyConsiderations || [],
    }
  } catch (error) {
    console.error('Error parsing AI response:', error)

    // Fallback: return a basic structure
    return {
      weeklySchedule: [],
      rationale: 'Unable to parse AI response. Please try again.',
      progressionStrategy: 'N/A',
      keyConsiderations: ['Failed to generate plan', 'Please try again or use template-based generation'],
    }
  }
}
