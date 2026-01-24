import { getWorkouts } from '@/lib/workouts/actions'
import { getGoals } from '@/lib/goals/actions'
import { getWorkoutPlans } from '@/lib/workout-plans/actions'
import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from './dashboard-content'
import type { WorkoutPlanSession } from '@/types'

// Server-side data fetching for optimal performance
async function getCurrentWeekSessions() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { sessions: [], currentWeek: 1 }
  }

  // Find active plan
  const { data: activePlan } = await supabase
    .from('workout_plans')
    .select('id, started_at, weeks_duration')
    .eq('user_id', user.id)
    .or('status.eq.active,status.eq.draft')
    .is('deleted_at', null)
    .single()

  if (!activePlan) {
    return { sessions: [], currentWeek: 1 }
  }

  // Calculate current week
  let currentWeek = 1
  if (activePlan.started_at) {
    const startDate = new Date(activePlan.started_at)
    const today = new Date()
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    currentWeek = Math.min(Math.floor(daysSinceStart / 7) + 1, activePlan.weeks_duration)
  }

  // Fetch sessions for current week
  const { data: sessions } = await supabase
    .from('workout_plan_sessions')
    .select('*')
    .eq('plan_id', activePlan.id)
    .eq('week_number', currentWeek)
    .is('deleted_at', null)
    .order('day_of_week', { ascending: true })

  return {
    sessions: (sessions as WorkoutPlanSession[]) || [],
    currentWeek
  }
}

async function getLatestWeeklyAnalysis() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // Check user preferences for weekly_analysis_enabled
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('weekly_analysis_enabled')
    .eq('user_id', user.id)
    .single()

  if (preferences?.weekly_analysis_enabled === false) {
    return null
  }

  // Get most recent undismissed analysis
  const { data: analysis } = await supabase
    .from('weekly_workout_analysis')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_dismissed', false)
    .order('week_end_date', { ascending: false })
    .limit(1)
    .single()

  return analysis || null
}

export default async function DashboardPage() {
  // Parallel data fetching for optimal performance
  const [workoutsResult, goalsResult, plansResult, sessionsResult, weeklyAnalysis] = await Promise.all([
    getWorkouts(),
    getGoals(),
    getWorkoutPlans(),
    getCurrentWeekSessions(),
    getLatestWeeklyAnalysis(),
  ])

  return (
    <DashboardContent
      initialWorkouts={workoutsResult.workouts || []}
      initialGoals={goalsResult.goals || []}
      initialPlans={plansResult.plans || []}
      initialWeekSessions={sessionsResult.sessions}
      initialCurrentWeek={sessionsResult.currentWeek}
      initialWeeklyAnalysis={weeklyAnalysis}
    />
  )
}
