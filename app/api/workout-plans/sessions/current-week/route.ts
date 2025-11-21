import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/workout-plans/sessions/current-week
 * Get current week's sessions for the active workout plan
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find active plan
    const { data: activePlan } = await supabase
      .from('workout_plans')
      .select('id, started_at, weeks_duration')
      .eq('user_id', user.id)
      .or('status.eq.active,status.eq.draft')
      .single()

    if (!activePlan) {
      return NextResponse.json({ sessions: [], currentWeek: 1 })
    }

    // Calculate current week (default to week 1 if not started)
    let currentWeek = 1
    if (activePlan.started_at) {
      const startDate = new Date(activePlan.started_at)
      const today = new Date()
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      currentWeek = Math.min(Math.floor(daysSinceStart / 7) + 1, activePlan.weeks_duration)
    }

    // Fetch sessions for current week
    const { data: sessions, error } = await supabase
      .from('workout_plan_sessions')
      .select('*')
      .eq('plan_id', activePlan.id)
      .eq('week_number', currentWeek)
      .order('day_of_week', { ascending: true })

    if (error) {
      console.error('Error fetching week sessions:', error)
      return NextResponse.json({ sessions: [], currentWeek: 1 })
    }

    return NextResponse.json({
      sessions: sessions || [],
      currentWeek
    })
  } catch (error) {
    console.error('Error in current-week endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
