export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          date: string
          duration_minutes: number | null
          effort_level: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          date: string
          duration_minutes?: number | null
          effort_level?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          date?: string
          duration_minutes?: number | null
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          workout_id: string
          name: string
          exercise_type: 'strength' | 'cardio' | 'functional'
          sets: number | null
          reps: number | null
          weight: number | null
          weight_unit: 'kg' | 'lbs'
          duration_minutes: number | null
          distance: number | null
          distance_unit: 'km' | 'miles'
          speed: number | null
          calories: number | null
          resistance_level: number | null
          incline: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          name: string
          exercise_type?: 'strength' | 'cardio' | 'functional'
          sets?: number | null
          reps?: number | null
          weight?: number | null
          weight_unit?: 'kg' | 'lbs'
          duration_minutes?: number | null
          distance?: number | null
          distance_unit?: 'km' | 'miles'
          speed?: number | null
          calories?: number | null
          resistance_level?: number | null
          incline?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          name?: string
          exercise_type?: 'strength' | 'cardio' | 'functional'
          sets?: number | null
          reps?: number | null
          weight?: number | null
          weight_unit?: 'kg' | 'lbs'
          duration_minutes?: number | null
          distance?: number | null
          distance_unit?: 'km' | 'miles'
          speed?: number | null
          calories?: number | null
          resistance_level?: number | null
          incline?: number | null
          notes?: string | null
        }
      }
      workout_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          exercises: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          exercises: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          exercises?: Json
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          target_value: number
          current_value: number
          initial_value: number
          unit: string
          target_date: string | null
          achieved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          target_value: number
          initial_value?: number
          current_value?: number
          unit: string
          target_date?: string | null
          achieved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_value?: number
          current_value?: number
          initial_value?: number
          unit?: string
          target_date?: string | null
          achieved?: boolean
          updated_at?: string
        }
      }
      workout_selfies: {
        Row: {
          id: string
          workout_id: string
          user_id: string
          file_path: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          caption: string | null
          taken_at: string
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          user_id: string
          file_path: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          caption?: string | null
          taken_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          user_id?: string
          file_path?: string
          file_name?: string
          file_size?: number | null
          mime_type?: string | null
          caption?: string | null
          taken_at?: string
        }
      }
      workout_plans: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          goal_id: string | null
          goal_type: 'weight_loss' | 'muscle_building' | 'endurance' | 'general_fitness'
          weeks_duration: number
          workouts_per_week: number
          avg_workout_duration: number | null
          status: 'draft' | 'active' | 'completed' | 'archived'
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          goal_id?: string | null
          goal_type: 'weight_loss' | 'muscle_building' | 'endurance' | 'general_fitness'
          weeks_duration?: number
          workouts_per_week?: number
          avg_workout_duration?: number | null
          status?: 'draft' | 'active' | 'completed' | 'archived'
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          goal_id?: string | null
          goal_type?: 'weight_loss' | 'muscle_building' | 'endurance' | 'general_fitness'
          weeks_duration?: number
          workouts_per_week?: number
          avg_workout_duration?: number | null
          status?: 'draft' | 'active' | 'completed' | 'archived'
          started_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      workout_plan_sessions: {
        Row: {
          id: string
          plan_id: string
          week_number: number
          day_of_week: number
          day_name: string
          session_order: number
          workout_template_id: string | null
          workout_name: string
          workout_type: 'strength' | 'cardio' | 'rest' | 'active_recovery' | 'mixed'
          estimated_duration: number | null
          exercises: Json
          muscle_groups: string[]
          intensity_level: 'low' | 'moderate' | 'high' | 'max' | null
          status: 'scheduled' | 'completed' | 'skipped' | 'modified'
          completed_workout_id: string | null
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          week_number: number
          day_of_week: number
          day_name: string
          session_order?: number
          workout_template_id?: string | null
          workout_name: string
          workout_type: 'strength' | 'cardio' | 'rest' | 'active_recovery' | 'mixed'
          estimated_duration?: number | null
          exercises?: Json
          muscle_groups?: string[]
          intensity_level?: 'low' | 'moderate' | 'high' | 'max' | null
          status?: 'scheduled' | 'completed' | 'skipped' | 'modified'
          completed_workout_id?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          week_number?: number
          day_of_week?: number
          day_name?: string
          session_order?: number
          workout_template_id?: string | null
          workout_name?: string
          workout_type?: 'strength' | 'cardio' | 'rest' | 'active_recovery' | 'mixed'
          estimated_duration?: number | null
          exercises?: Json
          muscle_groups?: string[]
          intensity_level?: 'low' | 'moderate' | 'high' | 'max' | null
          status?: 'scheduled' | 'completed' | 'skipped' | 'modified'
          completed_workout_id?: string | null
          completed_at?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      body_measurements: {
        Row: {
          id: string
          user_id: string
          measured_at: string
          weight: number | null
          body_fat_percentage: number | null
          muscle_mass: number | null
          bone_mass: number | null
          water_percentage: number | null
          height: number | null
          neck: number | null
          shoulders: number | null
          chest: number | null
          waist: number | null
          hips: number | null
          bicep_left: number | null
          bicep_right: number | null
          forearm_left: number | null
          forearm_right: number | null
          thigh_left: number | null
          thigh_right: number | null
          calf_left: number | null
          calf_right: number | null
          bmr: number | null
          metabolic_age: number | null
          visceral_fat: number | null
          protein_percentage: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          measured_at?: string
          weight?: number | null
          body_fat_percentage?: number | null
          muscle_mass?: number | null
          bone_mass?: number | null
          water_percentage?: number | null
          height?: number | null
          neck?: number | null
          shoulders?: number | null
          chest?: number | null
          waist?: number | null
          hips?: number | null
          bicep_left?: number | null
          bicep_right?: number | null
          forearm_left?: number | null
          forearm_right?: number | null
          thigh_left?: number | null
          thigh_right?: number | null
          calf_left?: number | null
          calf_right?: number | null
          bmr?: number | null
          metabolic_age?: number | null
          visceral_fat?: number | null
          protein_percentage?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          measured_at?: string
          weight?: number | null
          body_fat_percentage?: number | null
          muscle_mass?: number | null
          bone_mass?: number | null
          water_percentage?: number | null
          height?: number | null
          neck?: number | null
          shoulders?: number | null
          chest?: number | null
          waist?: number | null
          hips?: number | null
          bicep_left?: number | null
          bicep_right?: number | null
          forearm_left?: number | null
          forearm_right?: number | null
          thigh_left?: number | null
          thigh_right?: number | null
          calf_left?: number | null
          calf_right?: number | null
          bmr?: number | null
          metabolic_age?: number | null
          visceral_fat?: number | null
          protein_percentage?: number | null
          notes?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
