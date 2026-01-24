'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateGoalStatus } from './progress'
import { TABLES, ERRORS, PATHS } from '@/lib/constants'

export async function createGoal(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: ERRORS.NOT_AUTHENTICATED }
  }

  // Extract goal data
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const targetValue = formData.get('target_value') as string
  const currentValue = formData.get('current_value') as string
  const unit = formData.get('unit') as string
  const targetDate = formData.get('target_date') as string

  // Validate target date is not in the past
  if (targetDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDateObj = new Date(targetDate)
    targetDateObj.setHours(0, 0, 0, 0)

    if (targetDateObj < today) {
      return { error: 'Target date cannot be in the past' }
    }
  }

  const parsedCurrentValue = currentValue ? Number.parseFloat(currentValue) : 0
  const parsedTargetValue = Number.parseFloat(targetValue)

  // Calculate initial status
  const status = calculateGoalStatus({
    initial_value: parsedCurrentValue,
    current_value: parsedCurrentValue,
    target_value: parsedTargetValue,
    target_date: targetDate || null,
  })

  const achieved = status === 'completed'

  // Create goal
  const { data: goal, error: goalError } = await supabase
    .from(TABLES.GOALS)
    .insert({
      user_id: user.id,
      title,
      description,
      target_value: parsedTargetValue,
      current_value: parsedCurrentValue,
      initial_value: parsedCurrentValue, // Store initial value for progress tracking
      unit,
      target_date: targetDate || null,
      achieved,
      status,
    })
    .select()
    .single()

  if (goalError) {
    console.error('Goal error:', goalError)
    return { error: `Failed to create goal: ${goalError.message}` }
  }

  console.log('Goal created:', goal)

  // Revalidate the goals page to show new data
  revalidatePath(PATHS.GOALS)

  return { success: true, goalId: goal.id }
}

export async function getGoals() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log('No user found when fetching goals')
    return { goals: [] }
  }

  console.log('Fetching goals for user:', user.id)

  const { data: goals, error } = await supabase
    .from(TABLES.GOALS)
    .select('*')
    .eq('user_id', user.id)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching goals:', error)
    return { goals: [], error: error.message }
  }

  console.log('Fetched goals:', goals?.length || 0)

  return { goals: goals || [] }
}

export async function updateGoal(goalId: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: ERRORS.NOT_AUTHENTICATED }
  }

  // Get the existing goal to retrieve initial_value
  const { data: existingGoal } = await supabase
    .from(TABLES.GOALS)
    .select('initial_value')
    .eq('id', goalId)
    .eq('user_id', user.id)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (!existingGoal) {
    return { error: 'Goal not found' }
  }

  // Extract goal data
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const targetValue = formData.get('target_value') as string
  const currentValue = formData.get('current_value') as string
  const unit = formData.get('unit') as string
  const targetDate = formData.get('target_date') as string

  // Validate target date is not in the past
  if (targetDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDateObj = new Date(targetDate)
    targetDateObj.setHours(0, 0, 0, 0)

    if (targetDateObj < today) {
      return { error: 'Target date cannot be in the past' }
    }
  }

  // Check if target is reached using bidirectional logic
  const parsedCurrentValue = Number.parseFloat(currentValue)
  const parsedTargetValue = Number.parseFloat(targetValue)

  // Calculate status based on progress and target date
  const status = calculateGoalStatus({
    initial_value: existingGoal.initial_value,
    current_value: parsedCurrentValue,
    target_value: parsedTargetValue,
    target_date: targetDate || null,
  })

  const achieved = status === 'completed'

  const { error } = await supabase
    .from(TABLES.GOALS)
    .update({
      title,
      description,
      target_value: parsedTargetValue,
      current_value: parsedCurrentValue,
      unit,
      target_date: targetDate || null,
      achieved,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (error) {
    console.error('Update goal error:', error)
    return { error: `Failed to update goal: ${error.message}` }
  }

  revalidatePath(PATHS.GOALS)
  return { success: true }
}

export async function updateGoalProgress(goalId: string, currentValue: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: ERRORS.NOT_AUTHENTICATED }
  }

  // Get the goal to check status
  const { data: goal } = await supabase
    .from(TABLES.GOALS)
    .select('initial_value, target_value, target_date')
    .eq('id', goalId)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (!goal) {
    return { error: 'Goal not found' }
  }

  // Calculate status based on new current value
  const status = calculateGoalStatus({
    initial_value: goal.initial_value,
    current_value: currentValue,
    target_value: goal.target_value,
    target_date: goal.target_date,
  })

  const achieved = status === 'completed'

  const { error } = await supabase
    .from(TABLES.GOALS)
    .update({
      current_value: currentValue,
      achieved,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(PATHS.GOALS)
  return { success: true }
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: ERRORS.NOT_AUTHENTICATED }
  }

  // Soft delete: set deleted_at and archive status for consistency
  const { error } = await supabase
    .from(TABLES.GOALS)
    .update({
      deleted_at: new Date().toISOString(),
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('user_id', user.id)
    .is('deleted_at', null) // Only delete if not already deleted

  if (error) {
    return { error: error.message }
  }

  revalidatePath(PATHS.GOALS)
  return { success: true }
}
