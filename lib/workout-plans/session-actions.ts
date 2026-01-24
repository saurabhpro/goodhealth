'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { InsertWorkoutPlanSession, UpdateWorkoutPlanSession } from '@/types'
import { TABLES, ERRORS } from '@/lib/constants'

/**
 * Create a new plan session
 */
export async function createPlanSession(data: InsertWorkoutPlanSession) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: ERRORS.NOT_AUTHENTICATED }
  }

  // Verify plan belongs to user
  const { data: plan } = await supabase
    .from(TABLES.WORKOUT_PLANS)
    .select('id')
    .eq('id', data.plan_id)
    .eq('user_id', user.id)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (!plan) {
    return { error: ERRORS.PLAN_NOT_FOUND }
  }

  const { data: session, error } = await supabase
    .from(TABLES.WORKOUT_PLAN_SESSIONS)
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating plan session:', error)
    return { error: `Failed to create session: ${error.message}` }
  }

  revalidatePath(`/workout-plans/${data.plan_id}`)
  return { success: true, session }
}

/**
 * Get sessions for a specific week
 */
export async function getWeekSessions(planId: string, weekNumber: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: ERRORS.NOT_AUTHENTICATED }
  }

  // Verify plan belongs to user
  const { data: plan } = await supabase
    .from(TABLES.WORKOUT_PLANS)
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (!plan) {
    return { error: ERRORS.PLAN_NOT_FOUND }
  }

  const { data: sessions, error } = await supabase
    .from(TABLES.WORKOUT_PLAN_SESSIONS)
    .select('*')
    .eq('plan_id', planId)
    .eq('week_number', weekNumber)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .order('day_of_week', { ascending: true })
    .order('session_order', { ascending: true })

  if (error) {
    console.error('Error fetching week sessions:', error)
    return { sessions: [], error: error.message }
  }

  return { sessions: sessions || [] }
}

/**
 * Update a plan session
 */
export async function updatePlanSession(sessionId: string, data: UpdateWorkoutPlanSession) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: ERRORS.NOT_AUTHENTICATED }
  }

  // Verify session belongs to user's plan
  const { data: session } = await supabase
    .from(TABLES.WORKOUT_PLAN_SESSIONS)
    .select('plan_id, workout_plans!inner(user_id)')
    .eq('id', sessionId)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (!session || (session.workout_plans as unknown as { user_id: string }).user_id !== user.id) {
    return { error: ERRORS.SESSION_NOT_FOUND }
  }

  const { data: updatedSession, error } = await supabase
    .from(TABLES.WORKOUT_PLAN_SESSIONS)
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating plan session:', error)
    return { error: `Failed to update session: ${error.message}` }
  }

  revalidatePath(`/workout-plans/${session.plan_id}`)
  return { success: true, session: updatedSession }
}

/**
 * Complete a plan session (mark as completed and link to actual workout)
 */
export async function completePlanSession(sessionId: string, workoutId: string, notes?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: ERRORS.NOT_AUTHENTICATED }
  }

  // Verify session belongs to user's plan
  const { data: session } = await supabase
    .from(TABLES.WORKOUT_PLAN_SESSIONS)
    .select('plan_id, workout_plans!inner(user_id)')
    .eq('id', sessionId)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (!session || (session.workout_plans as unknown as { user_id: string }).user_id !== user.id) {
    return { error: ERRORS.SESSION_NOT_FOUND }
  }

  const { data: updatedSession, error } = await supabase
    .from(TABLES.WORKOUT_PLAN_SESSIONS)
    .update({
      status: 'completed',
      completed_workout_id: workoutId,
      completed_at: new Date().toISOString(),
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error completing plan session:', error)
    return { error: `Failed to complete session: ${error.message}` }
  }

  revalidatePath(`/workout-plans/${session.plan_id}`)
  return { success: true, session: updatedSession }
}

/**
 * Skip a plan session
 */
export async function skipPlanSession(sessionId: string, reason?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: ERRORS.NOT_AUTHENTICATED }
  }

  // Verify session belongs to user's plan
  const { data: session } = await supabase
    .from(TABLES.WORKOUT_PLAN_SESSIONS)
    .select('plan_id, workout_plans!inner(user_id)')
    .eq('id', sessionId)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (!session || (session.workout_plans as unknown as { user_id: string }).user_id !== user.id) {
    return { error: ERRORS.SESSION_NOT_FOUND }
  }

  const { data: updatedSession, error } = await supabase
    .from(TABLES.WORKOUT_PLAN_SESSIONS)
    .update({
      status: 'skipped',
      notes: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error skipping plan session:', error)
    return { error: `Failed to skip session: ${error.message}` }
  }

  revalidatePath(`/workout-plans/${session.plan_id}`)
  return { success: true, session: updatedSession }
}

/**
 * Delete a plan session
 */
export async function deletePlanSession(sessionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: ERRORS.NOT_AUTHENTICATED }
  }

  // Verify session belongs to user's plan
  const { data: session } = await supabase
    .from(TABLES.WORKOUT_PLAN_SESSIONS)
    .select('plan_id, workout_plans!inner(user_id)')
    .eq('id', sessionId)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (!session || (session.workout_plans as unknown as { user_id: string }).user_id !== user.id) {
    return { error: ERRORS.SESSION_NOT_FOUND }
  }

  const planId = session.plan_id

  const { error } = await supabase
    .from(TABLES.WORKOUT_PLAN_SESSIONS)
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('Error deleting plan session:', error)
    return { error: error.message }
  }

  revalidatePath(`/workout-plans/${planId}`)
  return { success: true }
}

/**
 * Get plan completion statistics
 */
export async function getPlanStats(planId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: ERRORS.NOT_AUTHENTICATED }
  }

  // Verify plan belongs to user
  const { data: plan } = await supabase
    .from(TABLES.WORKOUT_PLANS)
    .select('id')
    .eq('id', planId)
    .eq('user_id', user.id)
    // Exclude soft-deleted records
    .is('deleted_at', null)
    .single()

  if (!plan) {
    return { error: ERRORS.PLAN_NOT_FOUND }
  }

  const { data: sessions, error } = await supabase
    .from(TABLES.WORKOUT_PLAN_SESSIONS)
    .select('status, workout_type')
    .eq('plan_id', planId)
    // Exclude soft-deleted records
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching plan stats:', error)
    return { error: error.message }
  }

  const totalSessions = sessions?.length || 0
  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0
  const skippedSessions = sessions?.filter(s => s.status === 'skipped').length || 0
  const scheduledSessions = sessions?.filter(s => s.status === 'scheduled').length || 0

  const adherenceRate = totalSessions > 0
    ? ((completedSessions / (totalSessions - sessions.filter(s => s.workout_type === 'rest').length)) * 100)
    : 0

  return {
    stats: {
      totalSessions,
      completedSessions,
      skippedSessions,
      scheduledSessions,
      adherenceRate: Math.round(adherenceRate * 10) / 10, // Round to 1 decimal
    },
  }
}
