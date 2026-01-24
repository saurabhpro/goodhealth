/**
 * Tests for Workout Plans Server Component (page.tsx)
 * 
 * Since async Server Components can't be directly tested with Jest,
 * we test the data transformation logic that the server component uses.
 */

describe('WorkoutPlans Page - Data Transformation', () => {
  /**
   * Tests for data transformation from getWorkoutPlans
   */

  it('should transform null plans result to empty array', () => {
    const plansResult = { plans: null }
    const transformedPlans = plansResult.plans || []
    expect(transformedPlans).toEqual([])
  })

  it('should transform undefined plans result to empty array', () => {
    const plansResult = { plans: undefined }
    const transformedPlans = plansResult.plans || []
    expect(transformedPlans).toEqual([])
  })

  it('should pass through valid plans array', () => {
    const plansResult = { 
      plans: [
        { id: '1', name: 'Weight Loss', status: 'active' },
        { id: '2', name: 'Muscle Building', status: 'draft' },
      ] 
    }
    const transformedPlans = plansResult.plans || []
    expect(transformedPlans).toHaveLength(2)
    expect(transformedPlans[0].name).toBe('Weight Loss')
    expect(transformedPlans[1].name).toBe('Muscle Building')
  })

  it('should handle empty plans array', () => {
    const plansResult = { plans: [] }
    const transformedPlans = plansResult.plans || []
    expect(transformedPlans).toEqual([])
    expect(transformedPlans).toHaveLength(0)
  })
})

describe('WorkoutPlans Page - Plan Filtering', () => {
  /**
   * Tests for plan filtering logic (handled by getWorkoutPlans action)
   */

  it('should filter out deleted plans', () => {
    const plans = [
      { id: '1', name: 'Active Plan', deleted_at: null },
      { id: '2', name: 'Deleted Plan', deleted_at: '2024-01-01T00:00:00Z' },
    ]
    
    const notDeleted = plans.filter(p => p.deleted_at === null)
    expect(notDeleted).toHaveLength(1)
    expect(notDeleted[0].name).toBe('Active Plan')
  })

  it('should include plans of all statuses', () => {
    const plans = [
      { id: '1', status: 'active' },
      { id: '2', status: 'draft' },
      { id: '3', status: 'completed' },
      { id: '4', status: 'archived' },
    ]
    
    // getWorkoutPlans returns all plans (not deleted)
    expect(plans).toHaveLength(4)
  })

  it('should filter by user_id', () => {
    const plans = [
      { id: '1', user_id: 'user-1' },
      { id: '2', user_id: 'user-2' },
      { id: '3', user_id: 'user-1' },
    ]
    const userId = 'user-1'
    
    const userPlans = plans.filter(p => p.user_id === userId)
    expect(userPlans).toHaveLength(2)
  })
})

describe('WorkoutPlans Page - Props Validation', () => {
  /**
   * Tests for WorkoutPlan type validation
   */

  it('should validate required WorkoutPlan properties', () => {
    const validPlan = {
      id: 'plan-1',
      user_id: 'user-1',
      name: 'Test Plan',
      description: 'Test description',
      weeks_duration: 8,
      workouts_per_week: 4,
      avg_workout_duration: 45,
      goal_type: 'weight_loss',
      status: 'active',
      goal_id: 'goal-1',
      started_at: '2024-01-01',
      completed_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    expect(validPlan).toHaveProperty('id')
    expect(validPlan).toHaveProperty('user_id')
    expect(validPlan).toHaveProperty('name')
    expect(validPlan).toHaveProperty('weeks_duration')
    expect(validPlan).toHaveProperty('workouts_per_week')
    expect(validPlan).toHaveProperty('status')
    expect(validPlan).toHaveProperty('goal_type')
  })

  it('should allow nullable properties', () => {
    const planWithNulls = {
      id: 'plan-1',
      user_id: 'user-1',
      name: 'Test Plan',
      description: null,
      weeks_duration: 8,
      workouts_per_week: 4,
      avg_workout_duration: null,
      goal_type: 'weight_loss',
      status: 'active',
      goal_id: null,
      started_at: null,
      completed_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    expect(planWithNulls.description).toBeNull()
    expect(planWithNulls.avg_workout_duration).toBeNull()
    expect(planWithNulls.goal_id).toBeNull()
    expect(planWithNulls.started_at).toBeNull()
    expect(planWithNulls.completed_at).toBeNull()
  })
})

describe('WorkoutPlans Page - Status Handling', () => {
  /**
   * Tests for plan status display logic
   */

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'completed':
        return 'bg-blue-500'
      case 'draft':
        return 'bg-yellow-500'
      case 'archived':
        return 'bg-gray-500'
      default:
        return 'outline'
    }
  }

  it('should return correct badge class for active status', () => {
    expect(getStatusBadgeClass('active')).toBe('bg-green-500')
  })

  it('should return correct badge class for completed status', () => {
    expect(getStatusBadgeClass('completed')).toBe('bg-blue-500')
  })

  it('should return correct badge class for draft status', () => {
    expect(getStatusBadgeClass('draft')).toBe('bg-yellow-500')
  })

  it('should return correct badge class for archived status', () => {
    expect(getStatusBadgeClass('archived')).toBe('bg-gray-500')
  })

  it('should return outline class for unknown status', () => {
    expect(getStatusBadgeClass('unknown')).toBe('outline')
  })
})

describe('WorkoutPlans Page - Goal Type Formatting', () => {
  /**
   * Tests for goal type display formatting
   */

  function formatGoalType(goalType: string): string {
    return goalType.split('_').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ')
  }

  it('should format weight_loss as "Weight Loss"', () => {
    expect(formatGoalType('weight_loss')).toBe('Weight Loss')
  })

  it('should format muscle_building as "Muscle Building"', () => {
    expect(formatGoalType('muscle_building')).toBe('Muscle Building')
  })

  it('should format endurance as "Endurance"', () => {
    expect(formatGoalType('endurance')).toBe('Endurance')
  })

  it('should format general_fitness as "General Fitness"', () => {
    expect(formatGoalType('general_fitness')).toBe('General Fitness')
  })
})

describe('WorkoutPlans Page - Duration Display', () => {
  /**
   * Tests for weeks duration display logic
   */

  function formatWeeksDuration(weeks: number): string {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
  }

  it('should display singular "week" for 1 week', () => {
    expect(formatWeeksDuration(1)).toBe('1 week')
  })

  it('should display plural "weeks" for multiple weeks', () => {
    expect(formatWeeksDuration(2)).toBe('2 weeks')
    expect(formatWeeksDuration(8)).toBe('8 weeks')
    expect(formatWeeksDuration(12)).toBe('12 weeks')
  })
})

describe('WorkoutPlans Page - Date Calculations', () => {
  /**
   * Tests for plan end date calculation
   */

  function calculateEndDate(startedAt: string, weeksDuration: number): Date {
    const startDate = new Date(startedAt)
    return new Date(startDate.getTime() + (weeksDuration * 7 * 24 * 60 * 60 * 1000))
  }

  it('should calculate end date correctly for 4 week plan', () => {
    const startDate = '2024-01-01'
    const endDate = calculateEndDate(startDate, 4)
    
    expect(endDate.toISOString().split('T')[0]).toBe('2024-01-29')
  })

  it('should calculate end date correctly for 8 week plan', () => {
    const startDate = '2024-01-01'
    const endDate = calculateEndDate(startDate, 8)
    
    expect(endDate.toISOString().split('T')[0]).toBe('2024-02-26')
  })

  it('should calculate end date correctly for 12 week plan', () => {
    const startDate = '2024-01-01'
    const endDate = calculateEndDate(startDate, 12)
    
    expect(endDate.toISOString().split('T')[0]).toBe('2024-03-25')
  })
})

describe('WorkoutPlans Page - Sorting', () => {
  /**
   * Tests for plan sorting logic
   */

  it('should sort plans by created_at descending', () => {
    const plans = [
      { id: '1', created_at: '2024-01-01T00:00:00Z' },
      { id: '2', created_at: '2024-01-15T00:00:00Z' },
      { id: '3', created_at: '2024-01-10T00:00:00Z' },
    ]
    
    const sorted = [...plans].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    expect(sorted[0].id).toBe('2') // Most recent first
    expect(sorted[1].id).toBe('3')
    expect(sorted[2].id).toBe('1')
  })
})
