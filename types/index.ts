import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Workout = Database['public']['Tables']['workouts']['Row']
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type WorkoutTemplate = Database['public']['Tables']['workout_templates']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type WorkoutPlan = Database['public']['Tables']['workout_plans']['Row']
export type WorkoutPlanSession = Database['public']['Tables']['workout_plan_sessions']['Row']

export type InsertProfile = Database['public']['Tables']['profiles']['Insert']
export type InsertWorkout = Database['public']['Tables']['workouts']['Insert']
export type InsertExercise = Database['public']['Tables']['exercises']['Insert']
export type InsertWorkoutTemplate = Database['public']['Tables']['workout_templates']['Insert']
export type InsertGoal = Database['public']['Tables']['goals']['Insert']
export type InsertWorkoutPlan = Database['public']['Tables']['workout_plans']['Insert']
export type InsertWorkoutPlanSession = Database['public']['Tables']['workout_plan_sessions']['Insert']

export type UpdateProfile = Database['public']['Tables']['profiles']['Update']
export type UpdateWorkout = Database['public']['Tables']['workouts']['Update']
export type UpdateExercise = Database['public']['Tables']['exercises']['Update']
export type UpdateWorkoutTemplate = Database['public']['Tables']['workout_templates']['Update']
export type UpdateGoal = Database['public']['Tables']['goals']['Update']
export type UpdateWorkoutPlan = Database['public']['Tables']['workout_plans']['Update']
export type UpdateWorkoutPlanSession = Database['public']['Tables']['workout_plan_sessions']['Update']

export interface WorkoutWithExercises extends Workout {
  exercises: Exercise[]
}

export interface WorkoutPlanWithSessions extends WorkoutPlan {
  sessions: WorkoutPlanSession[]
}

export interface ExerciseStats {
  exerciseName: string
  maxWeight: number
  totalVolume: number
  averageReps: number
  workoutCount: number
}

export interface ProgressData {
  date: string
  value: number
  label?: string
}

// Workout Planning types
export type GoalType = 'weight_loss' | 'muscle_building' | 'endurance' | 'general_fitness'
export type WorkoutType = 'strength' | 'cardio' | 'rest' | 'active_recovery' | 'mixed'
export type IntensityLevel = 'low' | 'moderate' | 'high' | 'max'
export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived'
export type SessionStatus = 'scheduled' | 'completed' | 'skipped' | 'modified'
