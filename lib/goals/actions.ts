'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  // Create goal
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title,
      description,
      target_value: Number.parseFloat(targetValue),
      current_value: currentValue ? Number.parseFloat(currentValue) : 0,
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

  // Extract goal data
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const targetValue = formData.get('target_value') as string
  const currentValue = formData.get('current_value') as string
  const unit = formData.get('unit') as string
  const targetDate = formData.get('target_date') as string

  // Check if target is reached
  const parsedCurrentValue = Number.parseFloat(currentValue)
  const parsedTargetValue = Number.parseFloat(targetValue)
  const achieved = parsedCurrentValue >= parsedTargetValue

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
    .select('target_value')
    .eq('id', goalId)
    .single()

  const achieved = goal ? currentValue >= goal.target_value : false

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

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/goals')
  return { success: true }
}
