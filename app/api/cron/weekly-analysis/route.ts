import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateWeeklyAnalysis,
  saveWeeklyAnalysis,
} from '@/lib/weekly-analysis/ai-analyzer'
import { startOfWeek, subWeeks } from 'date-fns'

/**
 * GET /api/cron/weekly-analysis
 * Cron job to generate weekly analysis for all users with active goals/workout plans
 *
 * Should be scheduled to run every Monday morning (e.g., 8:00 AM)
 *
 * SECURITY: This endpoint should be protected by:
 * 1. Vercel Cron Secret (CRON_SECRET environment variable)
 * 2. Or IP whitelist if using external cron service
 *
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/weekly-analysis",
 *     "schedule": "0 8 * * 1"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create admin Supabase client (bypasses RLS)
    const supabase = await createClient()

    // Get all users who have active goals or workout plans
    const { data: usersWithGoals } = await supabase
      .from('goals')
      .select('user_id')
      .eq('achieved', false)
      .is('deleted_at', null)

    const { data: usersWithPlans } = await supabase
      .from('workout_plans')
      .select('user_id')
      .eq('status', 'active')
      .is('deleted_at', null)

    // Combine and deduplicate user IDs
    const allUserIds = new Set([
      ...(usersWithGoals?.map((g) => g.user_id) || []),
      ...(usersWithPlans?.map((p) => p.user_id) || []),
    ])

    const results = {
      total_users: allUserIds.size,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Get last week's Monday
    const lastMonday = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })

    // Generate analysis for each user
    for (const userId of allUserIds) {
      try {
        // Check if analysis already exists for this week
        const { data: existingAnalysis } = await supabase
          .from('weekly_workout_analysis')
          .select('id')
          .eq('user_id', userId)
          .eq('week_start_date', lastMonday.toISOString().split('T')[0])
          .is('deleted_at', null)
          .single()

        if (existingAnalysis) {
          console.log(`Analysis already exists for user ${userId}, skipping`)
          results.successful++
          continue
        }

        // Generate new analysis
        const analysis = await generateWeeklyAnalysis(userId, lastMonday)
        await saveWeeklyAnalysis(userId, lastMonday, analysis)

        results.successful++
        console.log(`Generated weekly analysis for user ${userId}`)
      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`User ${userId}: ${errorMessage}`)
        console.error(`Failed to generate analysis for user ${userId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly analysis generation completed',
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in weekly analysis cron job:', error)
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
