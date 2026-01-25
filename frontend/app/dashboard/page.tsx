import { getWorkouts } from '@/lib/workouts/actions'
import { getGoals } from '@/lib/goals/actions'
import { getWorkoutPlans, getCurrentWeekSessions } from '@/lib/workout-plans/actions'
import { getLatestWeeklyAnalysis } from '@/lib/weekly-analysis/actions'
import { DashboardContent } from './client'

// Force dynamic rendering - this page uses cookies for auth
export const dynamic = 'force-dynamic'

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
