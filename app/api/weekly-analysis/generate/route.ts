import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateWeeklyAnalysis,
  saveWeeklyAnalysis,
} from '@/lib/weekly-analysis/ai-analyzer'
import { startOfWeek, subWeeks } from 'date-fns'

/**
 * POST /api/weekly-analysis/generate
 * Generate weekly workout analysis for the authenticated user
 */
export async function POST(request: NextRequest) {
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

    // If user has weekly summary disabled, return 403 (forbidden)
    if (!weeklySummaryEnabled) {
      return NextResponse.json(
        { error: 'Weekly summary is disabled in settings. Enable it to generate analysis.' },
        { status: 403 }
      )
    }

    // Get week start date from request body (optional, defaults to last week)
    const body = await request.json().catch(() => ({}))
    const weekStartDate = body.weekStartDate
      ? new Date(body.weekStartDate)
      : startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })

    // Generate analysis using AI
    const analysis = await generateWeeklyAnalysis(user.id, weekStartDate)

    // Save to database
    const savedAnalysis = await saveWeeklyAnalysis(user.id, weekStartDate, analysis)

    return NextResponse.json({
      success: true,
      data: savedAnalysis,
    })
  } catch (error) {
    console.error('Error generating weekly analysis:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate weekly analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
