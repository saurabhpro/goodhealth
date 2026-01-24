/**
 * Shared constants for the application
 */

// Database table names
export const TABLES = {
  WORKOUTS: 'workouts',
  WORKOUT_PLANS: 'workout_plans',
  WORKOUT_PLAN_SESSIONS: 'workout_plan_sessions',
  GOALS: 'goals',
  SELFIES: 'workout_selfies',
  USER_WORKOUT_PREFERENCES: 'user_workout_preferences',
} as const

// Common error messages
export const ERRORS = {
  NOT_AUTHENTICATED: 'Not authenticated',
  PLAN_NOT_FOUND: 'Plan not found or access denied',
  SESSION_NOT_FOUND: 'Session not found or access denied',
  GOAL_NOT_FOUND: 'Goal not found or access denied',
  WORKOUT_NOT_FOUND: 'Workout not found or access denied',
  SELFIE_NOT_FOUND: 'Selfie not found',
} as const

// Revalidation paths
export const PATHS = {
  WORKOUT_PLANS: '/workout-plans',
  GOALS: '/goals',
  WORKOUTS: '/workouts',
  DASHBOARD: '/dashboard',
} as const
