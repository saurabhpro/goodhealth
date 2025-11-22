import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLatestWeeklyAnalysis } from '@/lib/weekly-analysis/ai-analyzer'

/**
 * GET /api/weekly-analysis/latest
 * Get the latest weekly analysis for the authenticated user
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

    // Fetch latest analysis
    const analysis = await getLatestWeeklyAnalysis(user.id)

    if (!analysis) {
      return NextResponse.json(
        { error: 'No weekly analysis found' },
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
