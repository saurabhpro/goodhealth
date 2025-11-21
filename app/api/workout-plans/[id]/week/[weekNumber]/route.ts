import { NextResponse } from 'next/server'
import { getWeekSessions } from '@/lib/workout-plans/session-actions'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; weekNumber: string }> }
) {
  try {
    const { id, weekNumber } = await params
    const week = parseInt(weekNumber, 10)

    if (isNaN(week) || week < 1) {
      return NextResponse.json(
        { error: 'Invalid week number' },
        { status: 400 }
      )
    }

    const result = await getWeekSessions(id, week)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json({ sessions: result.sessions, weekNumber: week })
  } catch (error) {
    console.error('Error fetching week schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch week schedule' },
      { status: 500 }
    )
  }
}
