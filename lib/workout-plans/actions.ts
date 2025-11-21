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

  // Soft delete: set deleted_at instead of hard delete
  const { error } = await supabase
    .from('workout_plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('user_id', user.id)
    .is('deleted_at', null) // Only delete if not already deleted

  if (error) {
    console.error('Error soft deleting workout plan:', error)
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

/**
 * Deactivate/Archive a workout plan
 */
export async function deactivateWorkoutPlan(planId: string) {
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
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error deactivating workout plan:', error)
    return { error: `Failed to deactivate workout plan: ${error.message}` }
  }

  revalidatePath('/workout-plans')
  revalidatePath(`/workout-plans/${planId}`)
  revalidatePath('/dashboard')
  return { success: true, plan }
}

/**
 * Get current week's sessions for active workout plan
 * Calculates the current week based on started_at date
 */
export async function getCurrentWeekSessions() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { sessions: [] }
  }

  // Find active plan
  const { data: activePlan } = await supabase
    .from('workout_plans')
    .select('id, started_at, weeks_duration')
    .eq('user_id', user.id)
    .or('status.eq.active,status.eq.draft')
    .single()

  if (!activePlan) {
    return { sessions: [] }
  }

  // Calculate current week (default to week 1 if not started)
  let currentWeek = 1
  if (activePlan.started_at) {
    const startDate = new Date(activePlan.started_at)
    const today = new Date()
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    currentWeek = Math.min(Math.floor(daysSinceStart / 7) + 1, activePlan.weeks_duration)
  }

  // Fetch sessions for current week
  const { data: sessions, error } = await supabase
    .from('workout_plan_sessions')
    .select('*')
    .eq('plan_id', activePlan.id)
    .eq('week_number', currentWeek)
    .order('day_of_week', { ascending: true })

  if (error) {
    console.error('Error fetching week sessions:', error)
    return { sessions: [] }
  }

  return { sessions: sessions || [], currentWeek }
}
