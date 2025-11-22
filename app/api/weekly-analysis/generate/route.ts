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
