import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLatestWeeklyAnalysis } from '@/lib/weekly-analysis/ai-analyzer'
import { startOfWeek, subWeeks } from 'date-fns'

/**
 * GET /api/weekly-analysis/latest
 * Get the latest weekly analysis for the authenticated user
 * Returns 404 if no analysis exists OR if the latest analysis is from a previous week
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user's weekly summary preference
    const { data: profile } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    const notificationPrefs = profile?.notification_preferences as { weekly_summary?: boolean } | null
    const weeklySummaryEnabled = notificationPrefs?.weekly_summary ?? false

    // If user has weekly summary disabled, return 404 (no analysis available)
    if (!weeklySummaryEnabled) {
      return NextResponse.json(
        { error: 'Weekly summary disabled in settings' },
        { status: 404 }
      )
    }

    // Fetch latest analysis
    const analysis = await getLatestWeeklyAnalysis(user.id)

    if (!analysis) {
      return NextResponse.json(
        { error: 'No weekly analysis found' },
        { status: 404 }
      )
    }

    // Check if the analysis is for the current week (last Monday)
    const lastMonday = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
    const analysisWeekStart = new Date(analysis.week_start_date)

    // Compare dates by setting time to midnight
    const lastMondayDate = new Date(lastMonday.getFullYear(), lastMonday.getMonth(), lastMonday.getDate())
    const analysisDate = new Date(analysisWeekStart.getFullYear(), analysisWeekStart.getMonth(), analysisWeekStart.getDate())

    // If analysis is not for the current week, treat as not found (triggers regeneration)
    if (analysisDate.getTime() !== lastMondayDate.getTime()) {
      return NextResponse.json(
        { error: 'No analysis for current week' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    })
  } catch (error) {
    console.error('Error fetching weekly analysis:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch weekly analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
