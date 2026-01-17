/**
 * Unit tests for goal actions
 */

import { updateGoal, deleteGoal } from '@/lib/goals/actions'
import { createClient } from '@/lib/supabase/server'
import { calculateGoalStatus } from '@/lib/goals/progress'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('Goal Actions', () => {
  let mockSupabase: ReturnType<typeof createClient>

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    }

    mockCreateClient.mockResolvedValue(mockSupabase)
  })

  describe('updateGoal', () => {
    it('should update an existing goal and ignore deleted records', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const existingGoal = { initial_value: 10 }
      const goalSingle = jest.fn().mockResolvedValue({ data: existingGoal, error: null })
      const goalIs = jest.fn().mockReturnValue({ single: goalSingle })
      const goalEq2 = jest.fn().mockReturnValue({ is: goalIs })
      const goalEq1 = jest.fn().mockReturnValue({ eq: goalEq2 })
      const goalSelect = jest.fn().mockReturnValue({ eq: goalEq1 })

      const updateIs = jest.fn().mockResolvedValue({ error: null })
      const updateEq2 = jest.fn().mockReturnValue({ is: updateIs })
      const updateEq1 = jest.fn().mockReturnValue({ eq: updateEq2 })
      const updateMock = jest.fn().mockReturnValue({ eq: updateEq1 })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'goals') {
          return {
            select: goalSelect,
            update: updateMock,
          }
        }
        return { select: jest.fn().mockReturnThis() }
      })

      const formData = new FormData()
      formData.set('title', 'New Title')
      formData.set('description', 'Updated description')
      formData.set('target_value', '100')
      formData.set('current_value', '20')
      formData.set('unit', 'kg')
      formData.set('target_date', '')

      const expectedStatus = calculateGoalStatus({
        initial_value: existingGoal.initial_value,
        current_value: 20,
        target_value: 100,
        target_date: null,
      })

      const result = await updateGoal('goal-123', formData)

      expect(result.success).toBe(true)
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Title',
          description: 'Updated description',
          target_value: 100,
          current_value: 20,
          unit: 'kg',
          target_date: null,
          status: expectedStatus,
          achieved: expectedStatus === 'completed',
          updated_at: expect.any(String),
        })
      )
      expect(updateIs).toHaveBeenCalledWith('deleted_at', null)
    })
  })

  describe('deleteGoal', () => {
    it('should archive and soft delete a goal', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const updateIs = jest.fn().mockResolvedValue({ error: null })
      const updateEq2 = jest.fn().mockReturnValue({ is: updateIs })
      const updateEq1 = jest.fn().mockReturnValue({ eq: updateEq2 })
      const updateMock = jest.fn().mockReturnValue({ eq: updateEq1 })

      mockSupabase.from.mockReturnValue({
        update: updateMock,
      })

      const result = await deleteGoal('goal-123')

      expect(result.success).toBe(true)
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
          status: 'archived',
          updated_at: expect.any(String),
        })
      )
      expect(updateIs).toHaveBeenCalledWith('deleted_at', null)
    })
  })
})
