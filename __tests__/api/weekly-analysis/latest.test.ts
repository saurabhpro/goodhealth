/**
 * @jest-environment node
 */
import { GET } from '@/app/api/weekly-analysis/latest/route'
import { createClient } from '@/lib/supabase/server'
import { getLatestWeeklyAnalysis } from '@/lib/weekly-analysis/ai-analyzer'
import { startOfWeek, subWeeks, format } from 'date-fns'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/weekly-analysis/ai-analyzer')

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
}

describe('GET /api/weekly-analysis/latest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 404 if no analysis exists', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    // Mock profile with weekly_summary enabled
    const mockFrom = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { notification_preferences: { weekly_summary: true } },
            error: null,
          }),
        })),
      })),
    }))
    mockSupabase.from = mockFrom

    ;(getLatestWeeklyAnalysis as jest.Mock).mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('No weekly analysis found')
  })

  it('should return 404 if analysis is from a previous week', async () => {
    const twoWeeksAgo = startOfWeek(subWeeks(new Date(), 2), { weekStartsOn: 1 })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    // Mock profile with weekly_summary enabled
    const mockFrom = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { notification_preferences: { weekly_summary: true } },
            error: null,
          }),
        })),
      })),
    }))
    mockSupabase.from = mockFrom

    ;(getLatestWeeklyAnalysis as jest.Mock).mockResolvedValue({
      id: 'analysis-1',
      week_start_date: format(twoWeeksAgo, 'yyyy-MM-dd'),
      analysis_summary: 'Old analysis',
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('No analysis for current week')
  })

  it('should return analysis if it exists for current week', async () => {
    const lastMonday = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    // Mock profile with weekly_summary enabled
    const mockFrom = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { notification_preferences: { weekly_summary: true } },
            error: null,
          }),
        })),
      })),
    }))
    mockSupabase.from = mockFrom

    ;(getLatestWeeklyAnalysis as jest.Mock).mockResolvedValue({
      id: 'analysis-1',
      week_start_date: format(lastMonday, 'yyyy-MM-dd'),
      analysis_summary: 'Current week analysis',
      key_achievements: ['Achievement 1'],
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('analysis-1')
    expect(data.data.analysis_summary).toBe('Current week analysis')
  })

  it('should handle errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    // Mock profile with weekly_summary enabled
    const mockFrom = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { notification_preferences: { weekly_summary: true } },
            error: null,
          }),
        })),
      })),
    }))
    mockSupabase.from = mockFrom

    ;(getLatestWeeklyAnalysis as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch weekly analysis')
    expect(data.details).toBe('Database error')
  })

  it('should return 404 if weekly summary is disabled', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    // Mock profile with weekly_summary disabled
    const mockFrom = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { notification_preferences: { weekly_summary: false } },
            error: null,
          }),
        })),
      })),
    }))
    mockSupabase.from = mockFrom

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Weekly summary disabled in settings')
  })
})
