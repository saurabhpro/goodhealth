/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/cron/weekly-analysis/route'
import { createClient } from '@/lib/supabase/server'
import { generateWeeklyAnalysis, saveWeeklyAnalysis } from '@/lib/weekly-analysis/ai-analyzer'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/weekly-analysis/ai-analyzer')

const mockSupabase = {
  from: jest.fn(),
}

describe('Weekly Analysis Cron Job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
    process.env.CRON_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.CRON_SECRET
  })

  describe('Authentication', () => {
    it('should reject requests without CRON_SECRET', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/weekly-analysis')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should reject requests with invalid CRON_SECRET', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/weekly-analysis', {
        headers: { Authorization: 'Bearer wrong-secret' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should accept requests with valid CRON_SECRET', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ data: [] }),
      }))

      const request = new NextRequest('http://localhost:3000/api/cron/weekly-analysis', {
        headers: { Authorization: 'Bearer test-secret' },
      })

      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('User Selection', () => {
    it('should find users with workouts from last week', async () => {
      const mockUsers = [{ user_id: 'user1' }, { user_id: 'user2' }]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workouts') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: mockUsers }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockResolvedValue({ data: [] }),
        }
      })

      const request = new NextRequest('http://localhost:3000/api/cron/weekly-analysis', {
        headers: { Authorization: 'Bearer test-secret' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.results.total_users).toBe(2)
    })

    it('should find users with active goals', async () => {
      const mockGoals = [{ user_id: 'user3' }]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'goals') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: mockGoals }),
          }
        }
        if (table === 'workouts') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: [] }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockResolvedValue({ data: [] }),
        }
      })

      const request = new NextRequest('http://localhost:3000/api/cron/weekly-analysis', {
        headers: { Authorization: 'Bearer test-secret' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.results.total_users).toBe(1)
    })

    it('should find users with active workout plans', async () => {
      const mockPlans = [{ user_id: 'user4' }]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workout_plans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: mockPlans }),
          }
        }
        if (table === 'workouts') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: [] }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockResolvedValue({ data: [] }),
        }
      })

      const request = new NextRequest('http://localhost:3000/api/cron/weekly-analysis', {
        headers: { Authorization: 'Bearer test-secret' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.results.total_users).toBe(1)
    })

    it('should deduplicate users from multiple sources', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        const sameUser = [{ user_id: 'user-duplicate' }]
        if (table === 'workouts') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: sameUser }),
          }
        }
        if (table === 'goals') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: sameUser }),
          }
        }
        if (table === 'workout_plans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: sameUser }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockResolvedValue({ data: [] }),
        }
      })

      const request = new NextRequest('http://localhost:3000/api/cron/weekly-analysis', {
        headers: { Authorization: 'Bearer test-secret' },
      })

      const response = await GET(request)
      const data = await response.json()

      // Should be 1, not 3, because same user appears in all three sources
      expect(data.results.total_users).toBe(1)
    })
  })

  describe('Analysis Generation', () => {
    beforeEach(() => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workouts') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: [{ user_id: 'user1' }] }),
          }
        }
        if (table === 'weekly_workout_analysis') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockResolvedValue({ data: [] }),
        }
      })
    })

    it('should generate analysis for eligible users', async () => {
      const mockAnalysis = {
        analysis_summary: 'Great week!',
        key_achievements: [],
        areas_for_improvement: [],
        recommendations: [],
        motivational_quote: 'Keep going!',
        weekly_stats: { workouts_completed: 3 },
        goal_progress: [],
        measurements_comparison: { has_measurements: false },
      }

      ;(generateWeeklyAnalysis as jest.Mock).mockResolvedValue(mockAnalysis)
      ;(saveWeeklyAnalysis as jest.Mock).mockResolvedValue({ id: 'analysis-1' })

      const request = new NextRequest('http://localhost:3000/api/cron/weekly-analysis', {
        headers: { Authorization: 'Bearer test-secret' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.results.successful).toBe(1)
      expect(data.results.failed).toBe(0)
      expect(generateWeeklyAnalysis).toHaveBeenCalledWith('user1', expect.any(Date))
      expect(saveWeeklyAnalysis).toHaveBeenCalled()
    })

    it('should skip users who already have analysis for the week', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workouts') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: [{ user_id: 'user1' }] }),
          }
        }
        if (table === 'weekly_workout_analysis') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'existing-analysis' } }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockResolvedValue({ data: [] }),
        }
      })

      const request = new NextRequest('http://localhost:3000/api/cron/weekly-analysis', {
        headers: { Authorization: 'Bearer test-secret' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(generateWeeklyAnalysis).not.toHaveBeenCalled()
      expect(data.results.successful).toBe(1) // Counted as success (already exists)
    })

    it('should handle errors gracefully and continue processing', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'workouts') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({
              data: [{ user_id: 'user1' }, { user_id: 'user2' }],
            }),
          }
        }
        if (table === 'weekly_workout_analysis') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          is: jest.fn().mockResolvedValue({ data: [] }),
        }
      })

      ;(generateWeeklyAnalysis as jest.Mock)
        .mockRejectedValueOnce(new Error('AI service error'))
        .mockResolvedValueOnce({
          analysis_summary: 'Success',
          key_achievements: [],
          areas_for_improvement: [],
          recommendations: [],
          motivational_quote: 'Nice!',
          weekly_stats: { workouts_completed: 2 },
          goal_progress: [],
          measurements_comparison: { has_measurements: false },
        })

      ;(saveWeeklyAnalysis as jest.Mock).mockResolvedValue({ id: 'analysis-2' })

      const request = new NextRequest('http://localhost:3000/api/cron/weekly-analysis', {
        headers: { Authorization: 'Bearer test-secret' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.results.successful).toBe(1)
      expect(data.results.failed).toBe(1)
      expect(data.results.errors).toHaveLength(1)
      expect(data.results.errors[0]).toContain('AI service error')
    })
  })

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({ data: [] }),
      }))

      const request = new NextRequest('http://localhost:3000/api/cron/weekly-analysis', {
        headers: { Authorization: 'Bearer test-secret' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('results')
      expect(data).toHaveProperty('timestamp')
      expect(data.results).toHaveProperty('total_users')
      expect(data.results).toHaveProperty('successful')
      expect(data.results).toHaveProperty('failed')
      expect(data.results).toHaveProperty('errors')
    })
  })
})
