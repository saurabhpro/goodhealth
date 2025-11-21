'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isGoalAchieved } from './progress'

export async function createGoal(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Extract goal data
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const targetValue = formData.get('target_value') as string
  const currentValue = formData.get('current_value') as string
  const unit = formData.get('unit') as string
  const targetDate = formData.get('target_date') as string

  const parsedCurrentValue = currentValue ? Number.parseFloat(currentValue) : 0

  // Create goal
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title,
      description,
      target_value: Number.parseFloat(targetValue),
      current_value: parsedCurrentValue,
      initial_value: parsedCurrentValue, // Store initial value for progress tracking
      unit,
      target_date: targetDate || null,
      achieved: false,
    })
    .select()
    .single()

  if (goalError) {
    console.error('Goal error:', goalError)
    return { error: `Failed to create goal: ${goalError.message}` }
  }

  console.log('Goal created:', goal)

  // Revalidate the goals page to show new data
  revalidatePath('/goals')

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
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
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
    return { error: 'Not authenticated' }
  }

  // Get the existing goal to retrieve initial_value
  const { data: existingGoal } = await supabase
    .from('goals')
    .select('initial_value')
    .eq('id', goalId)
    .eq('user_id', user.id)
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

  // Check if target is reached using bidirectional logic
  const parsedCurrentValue = Number.parseFloat(currentValue)
  const parsedTargetValue = Number.parseFloat(targetValue)
  const achieved = isGoalAchieved({
    initial_value: existingGoal.initial_value,
    current_value: parsedCurrentValue,
    target_value: parsedTargetValue,
  })

  const { error } = await supabase
    .from('goals')
    .update({
      title,
      description,
      target_value: parsedTargetValue,
      current_value: parsedCurrentValue,
      unit,
      target_date: targetDate || null,
      achieved,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Update goal error:', error)
    return { error: `Failed to update goal: ${error.message}` }
  }

  revalidatePath('/goals')
  return { success: true }
}

export async function updateGoalProgress(goalId: string, currentValue: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get the goal to check if target is reached
  const { data: goal } = await supabase
    .from('goals')
    .select('initial_value, target_value')
    .eq('id', goalId)
    .single()

  const achieved = goal
    ? isGoalAchieved({
        initial_value: goal.initial_value,
        current_value: currentValue,
        target_value: goal.target_value,
      })
    : false

  const { error } = await supabase
    .from('goals')
    .update({
      current_value: currentValue,
      achieved,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/goals')
  return { success: true }
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Soft delete: set deleted_at instead of hard delete
  const { error } = await supabase
    .from('goals')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', goalId)
    .eq('user_id', user.id)
    .is('deleted_at', null) // Only delete if not already deleted

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/goals')
  return { success: true }
}
