'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns'
import { GEMINI_MODEL } from '@/lib/config/ai-models'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface WeeklyStats {
  workouts_completed: number
  total_duration_minutes: number
  avg_effort_level: number
  total_exercises: number
  workout_types: Record<string, number>
  consistency_percentage: number
}

interface GoalProgress {
  goal_id: string
  goal_title: string
  goal_type: string
  current_value: number
  target_value: number
  progress_percentage: number
  change_this_week: number
  on_track: boolean
}

interface MeasurementsComparison {
  weight_change?: number
  body_fat_change?: number
  muscle_mass_change?: number
  has_measurements: boolean
}

interface UserProfile {
  id: string
  full_name?: string
  fitness_level?: string
  fitness_goals?: string[]
  medical_conditions?: string
  injuries?: string
}

interface WorkoutPlan {
  id: string
  name: string
  goal_type: string
  weeks_duration: number
  workouts_per_week: number
}

interface Exercise {
  id: string
  name: string
  exercise_type: string
}

interface Workout {
  id: string
  name?: string
  duration_minutes?: number
  effort_level?: number
  exercises?: Exercise[]
}

interface AnalysisContext {
  user_profile: UserProfile | null
  weekly_stats: WeeklyStats
  goal_progress: GoalProgress[]
  measurements_comparison: MeasurementsComparison
  recent_workouts: Workout[]
  active_workout_plan: WorkoutPlan | null
}

interface WeeklyAnalysisResult {
  analysis_summary: string
  key_achievements: string[]
  areas_for_improvement: string[]
  recommendations: string[]
  motivational_quote: string
}

/**
 * Fetch user's workout data for the previous week (Monday to Sunday)
 */
async function fetchWeekData(userId: string, weekStartDate: Date): Promise<AnalysisContext> {
  const supabase = await createClient()
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 })

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Fetch workouts from the week
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*, exercises(*)')
    .eq('user_id', userId)
    .gte('date', format(weekStartDate, 'yyyy-MM-dd'))
    .lte('date', format(weekEndDate, 'yyyy-MM-dd'))
    .is('deleted_at', null)
    .order('date', { ascending: false })

  // Calculate weekly stats
  const weekly_stats: WeeklyStats = {
    workouts_completed: workouts?.length || 0,
    total_duration_minutes: workouts?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0,
    avg_effort_level: workouts?.length
      ? workouts.reduce((sum, w) => sum + (w.effort_level || 0), 0) / workouts.length
      : 0,
    total_exercises:
      workouts?.reduce((sum, w) => sum + (w.exercises?.length || 0), 0) || 0,
    workout_types: {},
    consistency_percentage: 0,
  }

  // Calculate workout type distribution
  if (workouts) {
    for (const workout of workouts) {
      if (workout.exercises) {
        for (const exercise of workout.exercises) {
          const type = exercise.exercise_type || 'other'
          weekly_stats.workout_types[type] = (weekly_stats.workout_types[type] || 0) + 1
        }
      }
    }
  }

  // Fetch active goals and calculate progress
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('deleted_at', null)

  const goal_progress: GoalProgress[] = goals
    ? goals.map((goal) => {
        const progress =
          goal.target_value === goal.initial_value
              ? 0
              : ((goal.current_value - goal.initial_value) /
                  (goal.target_value - goal.initial_value)) *
              100

        return {
          goal_id: goal.id,
          goal_title: goal.title,
          goal_type: goal.unit || 'general',
          current_value: goal.current_value,
          target_value: goal.target_value,
          progress_percentage: Math.round(progress),
          change_this_week: 0, // Would need historical tracking for accurate calculation
          on_track: progress > 0,
        }
      })
    : []

  // Fetch body measurements comparison
  const { data: latestMeasurement } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .lte('measured_at', weekEndDate.toISOString())
    .is('deleted_at', null)
    .order('measured_at', { ascending: false })
    .limit(1)
    .single()

  const { data: previousMeasurement } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .lt('measured_at', weekStartDate.toISOString())
    .is('deleted_at', null)
    .order('measured_at', { ascending: false })
    .limit(1)
    .single()

  const hasMeasurements = !!latestMeasurement && !!previousMeasurement
  const measurements_comparison: MeasurementsComparison = {
    has_measurements: hasMeasurements,
  }

  if (hasMeasurements && latestMeasurement && previousMeasurement) {
    measurements_comparison.weight_change =
      (latestMeasurement.weight || 0) - (previousMeasurement.weight || 0)
    measurements_comparison.body_fat_change =
      (latestMeasurement.body_fat_percentage || 0) -
      (previousMeasurement.body_fat_percentage || 0)
    measurements_comparison.muscle_mass_change =
      (latestMeasurement.muscle_mass || 0) - (previousMeasurement.muscle_mass || 0)
  }

  // Fetch active workout plan
  const { data: activePlan } = await supabase
    .from('workout_plans')
    .select('*, workout_plan_sessions(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single()

  return {
    user_profile: profile,
    weekly_stats,
    goal_progress,
    measurements_comparison,
    recent_workouts: workouts || [],
    active_workout_plan: activePlan,
  }
}

/**
 * Build AI prompt for weekly analysis
 */
function buildAnalysisPrompt(context: AnalysisContext): string {
  const {
    user_profile,
    weekly_stats,
    goal_progress,
    measurements_comparison,
    recent_workouts,
    active_workout_plan,
  } = context

  return `You are a professional fitness coach and analyst. Analyze the following user's workout progress from the past week and provide comprehensive insights.

USER PROFILE:
- Name: ${user_profile?.full_name || 'User'}
- Fitness Level: ${user_profile?.fitness_level || 'intermediate'}
- Goals: ${user_profile?.fitness_goals?.join(', ') || 'general fitness'}
- Medical Conditions: ${user_profile?.medical_conditions || 'None'}
- Injuries: ${user_profile?.injuries || 'None'}

WEEKLY WORKOUT STATISTICS:
- Workouts Completed: ${weekly_stats.workouts_completed}
- Total Duration: ${weekly_stats.total_duration_minutes} minutes
- Average Effort Level: ${weekly_stats.avg_effort_level.toFixed(1)}/6
- Total Exercises: ${weekly_stats.total_exercises}
- Exercise Types: ${JSON.stringify(weekly_stats.workout_types)}

ACTIVE GOALS PROGRESS:
${goal_progress.map((g) => `- ${g.goal_title}: ${g.current_value}/${g.target_value} ${g.goal_type} (${g.progress_percentage}% complete)`).join('\n') || 'No active goals'}

${measurements_comparison.has_measurements ? `BODY MEASUREMENTS CHANGES:
- Weight Change: ${measurements_comparison.weight_change?.toFixed(2)} kg
- Body Fat Change: ${measurements_comparison.body_fat_change?.toFixed(2)}%
- Muscle Mass Change: ${measurements_comparison.muscle_mass_change?.toFixed(2)} kg` : 'No body measurements available for comparison'}

${active_workout_plan ? `ACTIVE WORKOUT PLAN: ${active_workout_plan.name}
- Goal Type: ${active_workout_plan.goal_type}
- Duration: ${active_workout_plan.weeks_duration} weeks
- Workouts Per Week: ${active_workout_plan.workouts_per_week}` : 'No active workout plan'}

RECENT WORKOUTS SUMMARY:
${recent_workouts.length > 0 ? recent_workouts.slice(0, 5).map((w) => `- ${w.name || 'Workout'} (${w.duration_minutes}min, effort: ${w.effort_level}/6) - ${w.exercises?.length || 0} exercises`).join('\n') : 'No workouts this week'}

Please provide a detailed analysis in the following JSON format:
{
  "analysis_summary": "2-3 paragraph comprehensive summary of their week's performance, highlighting patterns and overall progress",
  "key_achievements": ["achievement 1", "achievement 2", "achievement 3"],
  "areas_for_improvement": ["area 1", "area 2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"],
  "motivational_quote": "An original, personalized motivational quote based on their performance (not a generic fitness quote)"
}

IMPORTANT GUIDELINES:
- Be specific and reference actual numbers from their week
- Make the analysis personal and relevant to their goals
- Achievements should celebrate real progress (e.g., "Maintained consistent 5-workout week schedule")
- Improvements should be constructive (e.g., "Consider increasing workout intensity on strength days")
- Recommendations should be actionable and specific to their situation
- The motivational quote should be personalized to their journey, not a generic quote
- If they had a poor week, be encouraging but honest about areas to improve
- Consider their fitness level, medical conditions, and injuries in recommendations

Return ONLY the JSON object, no additional text.`
}

/**
 * Parse AI response and validate structure
 */
function parseAIAnalysis(responseText: string): WeeklyAnalysisResult {
  try {
    // Try to extract JSON from markdown code blocks if present
    let jsonText = responseText
    const jsonRegex = /```(?:json)?\s*(\{[\s\S]*\})\s*```/
    const jsonMatch = jsonRegex.exec(responseText)
    if (jsonMatch?.[1]) {
      jsonText = jsonMatch[1]
    }

    const parsed = JSON.parse(jsonText)

    // Validate required fields
    if (
      !parsed.analysis_summary ||
      !Array.isArray(parsed.key_achievements) ||
      !Array.isArray(parsed.areas_for_improvement) ||
      !Array.isArray(parsed.recommendations) ||
      !parsed.motivational_quote
    ) {
      throw new Error('Invalid AI response structure')
    }

    return {
      analysis_summary: parsed.analysis_summary,
      key_achievements: parsed.key_achievements,
      areas_for_improvement: parsed.areas_for_improvement,
      recommendations: parsed.recommendations,
      motivational_quote: parsed.motivational_quote,
    }
  } catch (error) {
    console.error('Failed to parse AI analysis:', error)
    throw new Error('Failed to parse AI analysis response')
  }
}

/**
 * Generate weekly workout analysis using AI
 */
export async function generateWeeklyAnalysis(
  userId: string,
  weekStartDate?: Date
): Promise<WeeklyAnalysisResult & { weekly_stats: WeeklyStats; goal_progress: GoalProgress[]; measurements_comparison: MeasurementsComparison }> {
  // Default to previous Monday (last week)
  const targetDate = weekStartDate || startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })

  // Fetch all required data
  const context = await fetchWeekData(userId, targetDate)

  // Build AI prompt
  const prompt = buildAnalysisPrompt(context)

  // Call Gemini AI
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
  })

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  // Parse and validate response
  const analysis = parseAIAnalysis(text)

  return {
    ...analysis,
    weekly_stats: context.weekly_stats,
    goal_progress: context.goal_progress,
    measurements_comparison: context.measurements_comparison,
  }
}

/**
 * Save weekly analysis to database
 */
export async function saveWeeklyAnalysis(
  userId: string,
  weekStartDate: Date,
  analysis: WeeklyAnalysisResult & { weekly_stats: WeeklyStats; goal_progress: GoalProgress[]; measurements_comparison: MeasurementsComparison }
) {
  const supabase = await createClient()
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 })

  const { data, error } = await supabase
    .from('weekly_workout_analysis')
    .upsert(
      {
        user_id: userId,
        week_start_date: format(weekStartDate, 'yyyy-MM-dd'),
        week_end_date: format(weekEndDate, 'yyyy-MM-dd'),
        analysis_summary: analysis.analysis_summary,
        key_achievements: analysis.key_achievements,
        areas_for_improvement: analysis.areas_for_improvement,
        recommendations: analysis.recommendations,
        motivational_quote: analysis.motivational_quote,
        weekly_stats: analysis.weekly_stats,
        goal_progress: analysis.goal_progress,
        measurements_comparison: analysis.measurements_comparison,
      },
      {
        onConflict: 'user_id,week_start_date',
      }
    )
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save weekly analysis: ${error.message}`)
  }

  return data
}

/**
 * Get user's latest weekly analysis
 */
export async function getLatestWeeklyAnalysis(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('weekly_workout_analysis')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('week_start_date', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw new Error(`Failed to fetch weekly analysis: ${error.message}`)
  }

  return data
}

/**
 * Mark weekly analysis as viewed
 */
export async function markAnalysisAsViewed(analysisId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('weekly_workout_analysis')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', analysisId)
    .is('viewed_at', null) // Only update if not already viewed

  if (error) {
    throw new Error(`Failed to mark analysis as viewed: ${error.message}`)
  }
}

/**
 * Dismiss weekly analysis
 */
export async function dismissAnalysis(analysisId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('weekly_workout_analysis')
    .update({ is_dismissed: true })
    .eq('id', analysisId)

  if (error) {
    throw new Error(`Failed to dismiss analysis: ${error.message}`)
  }
}
