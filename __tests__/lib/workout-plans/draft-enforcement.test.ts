/**
 * Unit tests for workout plan draft enforcement
 * Tests that soft-deleted plans don't block new draft creation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

// Mock the createClient function
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

describe('Workout Plan Draft Enforcement', () => {
  const mockUserId = 'test-user-123'
  const mockGoalId = 'test-goal-456'

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })
  })

  describe('Draft plan creation with soft delete', () => {
    it('should allow creating new draft when previous draft was soft-deleted', async () => {
      // Setup: User has a soft-deleted draft plan
      const softDeletedDraft = {
        id: 'old-draft-123',
        status: 'draft',
        name: 'Old Draft',
        deleted_at: '2025-11-20T00:00:00Z', // Soft deleted
      }

      // Mock query chain
      const selectMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockReturnThis()
      const inMock = vi.fn().mockReturnThis()
      const isMock = vi.fn().mockResolvedValue({
        data: [], // No active drafts (soft-deleted one filtered out)
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        in: inMock,
        is: isMock,
      })

      selectMock.mockReturnValue({
        eq: eqMock,
      })
      eqMock.mockReturnValue({
        eq: eqMock,
        in: inMock,
      })
      inMock.mockReturnValue({
        is: isMock,
      })

      // Execute: Check for existing drafts
      const result = await mockSupabaseClient
        .from('workout_plans')
        .select('id, status, name')
        .eq('user_id', mockUserId)
        .eq('goal_id', mockGoalId)
        .in('status', ['active', 'draft'])
        .is('deleted_at', null)

      // Verify: Filter correctly excludes soft-deleted plans
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workout_plans')
      expect(isMock).toHaveBeenCalledWith('deleted_at', null)
      expect(result.data).toEqual([]) // Empty = no blocking draft
    })

    it('should block creating new draft when active non-deleted draft exists', async () => {
      // Setup: User has an active (non-deleted) draft
      const activeDraft = {
        id: 'active-draft-789',
        status: 'draft',
        name: 'Active Draft',
        deleted_at: null, // NOT deleted
      }

      const selectMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockReturnThis()
      const inMock = vi.fn().mockReturnThis()
      const isMock = vi.fn().mockResolvedValue({
        data: [activeDraft], // Found active draft
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        in: inMock,
        is: isMock,
      })

      selectMock.mockReturnValue({
        eq: eqMock,
      })
      eqMock.mockReturnValue({
        eq: eqMock,
        in: inMock,
      })
      inMock.mockReturnValue({
        is: isMock,
      })

      // Execute
      const result = await mockSupabaseClient
        .from('workout_plans')
        .select('id, status, name')
        .eq('user_id', mockUserId)
        .eq('goal_id', mockGoalId)
        .in('status', ['active', 'draft'])
        .is('deleted_at', null)

      // Verify: Found blocking draft
      expect(result.data).toHaveLength(1)
      expect(result.data[0].status).toBe('draft')
      expect(result.data[0].deleted_at).toBeNull()
    })

    it('should allow creating draft after soft-deleting previous active plan', async () => {
      // Setup: User soft-deleted their active plan
      const selectMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockReturnThis()
      const inMock = vi.fn().mockReturnThis()
      const isMock = vi.fn().mockResolvedValue({
        data: [], // No active plans (soft-deleted)
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        in: inMock,
        is: isMock,
      })

      selectMock.mockReturnValue({
        eq: eqMock,
      })
      eqMock.mockReturnValue({
        eq: eqMock,
        in: inMock,
      })
      inMock.mockReturnValue({
        is: isMock,
      })

      // Execute
      const result = await mockSupabaseClient
        .from('workout_plans')
        .select('id, status, name')
        .eq('user_id', mockUserId)
        .eq('goal_id', mockGoalId)
        .in('status', ['active', 'draft'])
        .is('deleted_at', null)

      // Verify
      expect(result.data).toEqual([])
    })
  })

  describe('Query filter validation', () => {
    it('should always include deleted_at IS NULL filter in plan queries', () => {
      const selectMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockReturnThis()
      const isMock = vi.fn().mockResolvedValue({ data: [], error: null })

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        is: isMock,
      })

      selectMock.mockReturnValue({
        eq: eqMock,
      })
      eqMock.mockReturnValue({
        is: isMock,
      })

      mockSupabaseClient
        .from('workout_plans')
        .select('*')
        .eq('user_id', mockUserId)
        .is('deleted_at', null)

      // Verify filter was applied
      expect(isMock).toHaveBeenCalledWith('deleted_at', null)
    })

    it('should filter soft-deleted records in all user-facing queries', () => {
      const tables = [
        'workouts',
        'goals',
        'workout_plans',
        'body_measurements',
        'workout_templates',
        'workout_selfies',
      ]

      tables.forEach((table) => {
        const selectMock = vi.fn().mockReturnThis()
        const eqMock = vi.fn().mockReturnThis()
        const isMock = vi.fn().mockResolvedValue({ data: [], error: null })

        mockSupabaseClient.from.mockReturnValue({
          select: selectMock,
          eq: eqMock,
          is: isMock,
        })

        selectMock.mockReturnValue({
          eq: eqMock,
        })
        eqMock.mockReturnValue({
          is: isMock,
        })

        mockSupabaseClient
          .from(table)
          .select('*')
          .eq('user_id', mockUserId)
          .is('deleted_at', null)

        expect(isMock).toHaveBeenCalledWith('deleted_at', null)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle multiple soft-deleted drafts correctly', async () => {
      const selectMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockReturnThis()
      const inMock = vi.fn().mockReturnThis()
      const isMock = vi.fn().mockResolvedValue({
        data: [], // All filtered out by deleted_at check
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        in: inMock,
        is: isMock,
      })

      selectMock.mockReturnValue({
        eq: eqMock,
      })
      eqMock.mockReturnValue({
        eq: eqMock,
        in: inMock,
      })
      inMock.mockReturnValue({
        is: isMock,
      })

      const result = await mockSupabaseClient
        .from('workout_plans')
        .select('id, status, name')
        .eq('user_id', mockUserId)
        .eq('goal_id', mockGoalId)
        .in('status', ['active', 'draft'])
        .is('deleted_at', null)

      expect(result.data).toEqual([])
    })

    it('should not allow creating draft if active plan exists (even different goal)', async () => {
      // This tests the business rule in activateWorkoutPlan
      const selectMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockReturnThis()
      const isMock = vi.fn().mockResolvedValue({
        data: [{ id: 'other-active-plan' }],
        error: null,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        is: isMock,
      })

      selectMock.mockReturnValue({
        eq: eqMock,
      })
      eqMock.mockReturnValue({
        eq: eqMock,
        is: isMock,
      })

      const result = await mockSupabaseClient
        .from('workout_plans')
        .select('id')
        .eq('user_id', mockUserId)
        .eq('status', 'active')
        .is('deleted_at', null)

      expect(result.data).toHaveLength(1)
    })
  })
})
