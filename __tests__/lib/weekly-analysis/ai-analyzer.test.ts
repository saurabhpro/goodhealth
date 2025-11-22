import {
  generateWeeklyAnalysis,
  saveWeeklyAnalysis,
  getLatestWeeklyAnalysis,
  markAnalysisAsViewed,
  dismissAnalysis,
} from '@/lib/weekly-analysis/ai-analyzer'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(),
}))

const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
}

describe('Weekly Analysis - AI Analyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('generateWeeklyAnalysis', () => {
    it.skip('should fetch and analyze user workout data', async () => {
      const mockWorkouts = [
        {
          id: '1',
          name: 'Workout 1',
          duration_minutes: 45,
          effort_level: 4,
          exercises: [{ id: 'e1', exercise_type: 'strength' }],
        },
      ]

      const mockGoals = [
        {
          id: 'g1',
          title: 'Weight Loss',
          unit: 'kg',
          current_value: 80,
          target_value: 75,
          initial_value: 85,
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'user1',
                full_name: 'Test User',
                fitness_level: 'intermediate',
              },
            }),
          }
        }
        if (table === 'workouts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockWorkouts }),
          }
        }
        if (table === 'goals') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: mockGoals }),
          }
        }
        if (table === 'body_measurements') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null }),
          }
        }
        if (table === 'workout_plans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
        }
      })

      const result = await generateWeeklyAnalysis('user1')

      expect(result).toHaveProperty('analysis_summary')
      expect(result).toHaveProperty('weekly_stats')
      expect(result.weekly_stats.workouts_completed).toBe(1)
    })
  })

  describe('saveWeeklyAnalysis', () => {
    it('should save analysis to database', async () => {
      const mockInsert = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'analysis1' },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      })

      const analysis = {
        analysis_summary: 'Test summary',
        key_achievements: ['Achievement 1'],
        areas_for_improvement: ['Improve 1'],
        recommendations: ['Recommendation 1'],
        motivational_quote: 'Keep going!',
        weekly_stats: {
          workouts_completed: 3,
          total_duration_minutes: 120,
          avg_effort_level: 4,
          total_exercises: 10,
          workout_types: { strength: 5 },
          consistency_percentage: 0,
        },
        goal_progress: [],
        measurements_comparison: { has_measurements: false },
      }

      const result = await saveWeeklyAnalysis(
        'user1',
        new Date('2024-01-01'),
        analysis
      )

      expect(mockInsert).toHaveBeenCalled()
      expect(result).toHaveProperty('id')
    })
  })

  describe('getLatestWeeklyAnalysis', () => {
    it('should fetch latest analysis for user', async () => {
      const mockAnalysis = {
        id: 'analysis1',
        user_id: 'user1',
        week_start_date: '2024-01-01',
        analysis_summary: 'Summary',
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockAnalysis,
          error: null,
        }),
      })

      const result = await getLatestWeeklyAnalysis('user1')

      expect(result).toEqual(mockAnalysis)
    })

    it('should return null when no analysis found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })

      const result = await getLatestWeeklyAnalysis('user1')

      expect(result).toBeNull()
    })
  })

  describe('markAnalysisAsViewed', () => {
    it('should update viewed_at timestamp', async () => {
      const mockUpdate = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockReturnThis()
      const mockIs = jest.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        is: mockIs,
      })

      await markAnalysisAsViewed('analysis1')

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ viewed_at: expect.any(String) })
      )
      expect(mockEq).toHaveBeenCalledWith('id', 'analysis1')
    })
  })

  describe('dismissAnalysis', () => {
    it('should set is_dismissed to true', async () => {
      const mockUpdate = jest.fn().mockReturnThis()
      const mockEq = jest.fn().mockResolvedValue({ error: null })

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
      })

      await dismissAnalysis('analysis1')

      expect(mockUpdate).toHaveBeenCalledWith({ is_dismissed: true })
      expect(mockEq).toHaveBeenCalledWith('id', 'analysis1')
    })
  })
})
