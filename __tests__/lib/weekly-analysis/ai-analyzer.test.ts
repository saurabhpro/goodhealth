import {
  generateWeeklyAnalysis,
  saveWeeklyAnalysis,
  getLatestWeeklyAnalysis,
  markAnalysisAsViewed,
  dismissAnalysis,
} from '@/lib/weekly-analysis/ai-analyzer'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

// Mock Gemini AI
const mockGenerateContent = jest.fn()
const mockGetGenerativeModel = jest.fn()

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: mockGenerateContent,
    })),
  })),
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
    it('should fetch and analyze user workout data', async () => {
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
                fitness_goals: ['weight_loss'],
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

      // Mock Gemini AI response
      const mockAIResponse = {
        analysis_summary: 'Great week of training! You completed 1 workout with solid effort.',
        key_achievements: [
          'Completed workout with 4/6 effort level',
          'Maintained consistency',
          'Progress toward weight loss goal',
        ],
        areas_for_improvement: [
          'Consider adding more workouts per week',
          'Try varying exercise types',
        ],
        recommendations: [
          'Add 1-2 more workouts to your weekly routine',
          'Include cardio exercises for better weight loss results',
          'Track your nutrition alongside workouts',
        ],
        motivational_quote: 'Every workout is progress, Test User. Keep pushing forward!',
      }

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockAIResponse),
        },
      })

      const result = await generateWeeklyAnalysis('user1')

      expect(result).toHaveProperty('analysis_summary')
      expect(result).toHaveProperty('weekly_stats')
      expect(result).toHaveProperty('key_achievements')
      expect(result).toHaveProperty('areas_for_improvement')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('motivational_quote')
      expect(result.weekly_stats.workouts_completed).toBe(1)
      expect(result.analysis_summary).toBe(mockAIResponse.analysis_summary)
      expect(result.key_achievements).toEqual(mockAIResponse.key_achievements)
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('Test User'))
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('Workouts Completed: 1'))
    })

    it('should handle AI response wrapped in markdown code blocks', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'user1', full_name: 'Test User' },
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
            order: jest.fn().mockResolvedValue({ data: [] }),
          }
        }
        if (table === 'goals') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: [] }),
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
        return { select: jest.fn().mockReturnThis() }
      })

      const mockAIResponse = {
        analysis_summary: 'No workouts this week.',
        key_achievements: ['Stayed injury-free'],
        areas_for_improvement: ['Need to start working out'],
        recommendations: ['Schedule at least 3 workouts'],
        motivational_quote: 'Start today!',
      }

      // AI returns JSON wrapped in markdown code block
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => `\`\`\`json\n${JSON.stringify(mockAIResponse)}\n\`\`\``,
        },
      })

      const result = await generateWeeklyAnalysis('user1')

      expect(result.analysis_summary).toBe(mockAIResponse.analysis_summary)
      expect(result.key_achievements).toEqual(mockAIResponse.key_achievements)
    })

    it('should throw error when AI returns invalid JSON', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'user1', full_name: 'Test User' },
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
            order: jest.fn().mockResolvedValue({ data: [] }),
          }
        }
        if (table === 'goals') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: [] }),
          }
        }
        if (table === 'body_measurements') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
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
        return { select: jest.fn().mockReturnThis() }
      })

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'This is not valid JSON',
        },
      })

      await expect(generateWeeklyAnalysis('user1')).rejects.toThrow(
        'Failed to parse AI analysis response'
      )
    })

    it('should throw error when AI returns incomplete data structure', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'user1', full_name: 'Test User' },
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
            order: jest.fn().mockResolvedValue({ data: [] }),
          }
        }
        if (table === 'goals') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockResolvedValue({ data: [] }),
          }
        }
        if (table === 'body_measurements') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
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
        return { select: jest.fn().mockReturnThis() }
      })

      // Missing required fields
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              analysis_summary: 'Summary',
              // Missing other required fields
            }),
        },
      })

      await expect(generateWeeklyAnalysis('user1')).rejects.toThrow(
        'Failed to parse AI analysis response'
      )
    })
  })

  describe('saveWeeklyAnalysis', () => {
    it('should save analysis to database', async () => {
      const mockUpsert = jest.fn().mockReturnThis()
      const mockSelect = jest.fn().mockReturnThis()
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'analysis1' },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        upsert: mockUpsert,
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

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user1',
          analysis_summary: 'Test summary',
        }),
        { onConflict: 'user_id,week_start_date' }
      )
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
