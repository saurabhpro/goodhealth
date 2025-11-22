import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { markAnalysisAsViewed } from '@/lib/weekly-analysis/ai-analyzer'

/**
 * PUT /api/weekly-analysis/[id]/view
 * Mark a weekly analysis as viewed
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Mark as viewed
    await markAnalysisAsViewed(id)

    return NextResponse.json({
      success: true,
      message: 'Analysis marked as viewed',
    })
  } catch (error) {
    console.error('Error marking analysis as viewed:', error)
    return NextResponse.json(
      {
        error: 'Failed to mark analysis as viewed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
