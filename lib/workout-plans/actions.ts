'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { InsertWorkoutPlan, UpdateWorkoutPlan } from '@/types'

/**
 * Create a new workout plan
 */
export async function createWorkoutPlan(data: Omit<InsertWorkoutPlan, 'user_id'>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: plan, error } = await supabase
    .from('workout_plans')
    .insert({
      ...data,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating workout plan:', error)
    return { error: `Failed to create workout plan: ${error.message}` }
  }

  revalidatePath('/workout-plans')
  return { success: true, plan }
}

/**
 * Get all workout plans for the current user
 */
export async function getWorkoutPlans() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.log('No user found when fetching workout plans')
    return { plans: [] }
  }

  const { data: plans, error } = await supabase
    .from('workout_plans')
    .select('*, goals(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching workout plans:', error)
    return { plans: [], error: error.message }
  }

  return { plans: plans || [] }
}

/**
 * Get a single workout plan by ID with all sessions
 */
export async function getWorkoutPlan(planId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: plan, error } = await supabase
    .from('workout_plans')
    .select(`
      *,
      goals(*),
      workout_plan_sessions(*)
    `)
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching workout plan:', error)
    return { error: `Failed to fetch workout plan: ${error.message}` }
  }

  return { plan }
}

/**
 * Update a workout plan
 */
export async function updateWorkoutPlan(planId: string, data: UpdateWorkoutPlan) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: plan, error } = await supabase
    .from('workout_plans')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating workout plan:', error)
    return { error: `Failed to update workout plan: ${error.message}` }
  }

  revalidatePath('/workout-plans')
  revalidatePath(`/workout-plans/${planId}`)
  return { success: true, plan }
}

/**
 * Delete a workout plan (also deletes all sessions via CASCADE)
 */
export async function deleteWorkoutPlan(planId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('workout_plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting workout plan:', error)
    return { error: error.message }
  }

  revalidatePath('/workout-plans')
  return { success: true }
}

/**
 * Activate a workout plan (sets status to active and started_at to now)
 */
export async function activateWorkoutPlan(planId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if there's already an active plan
  const { data: activePlans } = await supabase
    .from('workout_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (activePlans && activePlans.length > 0) {
    return {
      error: 'You already have an active plan. Complete or archive it first.',
    }
  }

  const { data: plan, error } = await supabase
    .from('workout_plans')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error activating workout plan:', error)
    return { error: `Failed to activate workout plan: ${error.message}` }
  }

  revalidatePath('/workout-plans')
  revalidatePath(`/workout-plans/${planId}`)
  return { success: true, plan }
}

/**
 * Complete a workout plan (sets status to completed and completed_at to now)
 */
export async function completeWorkoutPlan(planId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: plan, error } = await supabase
    .from('workout_plans')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error completing workout plan:', error)
    return { error: `Failed to complete workout plan: ${error.message}` }
  }

  revalidatePath('/workout-plans')
  revalidatePath(`/workout-plans/${planId}`)
  return { success: true, plan }
}
