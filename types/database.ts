export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      body_measurements: {
        Row: {
          bicep_left: number | null
          bicep_right: number | null
          bmr: number | null
          body_fat_percentage: number | null
          bone_mass: number | null
          calf_left: number | null
          calf_right: number | null
          chest: number | null
          created_at: string | null
          forearm_left: number | null
          forearm_right: number | null
          height: number | null
          hips: number | null
          id: string
          measured_at: string
          metabolic_age: number | null
          muscle_mass: number | null
          neck: number | null
          notes: string | null
          protein_percentage: number | null
          shoulders: number | null
          thigh_left: number | null
          thigh_right: number | null
          updated_at: string | null
          user_id: string
          visceral_fat: number | null
          waist: number | null
          water_percentage: number | null
          weight: number | null
        }
        Insert: {
          bicep_left?: number | null
          bicep_right?: number | null
          bmr?: number | null
          body_fat_percentage?: number | null
          bone_mass?: number | null
          calf_left?: number | null
          calf_right?: number | null
          chest?: number | null
          created_at?: string | null
          forearm_left?: number | null
          forearm_right?: number | null
          height?: number | null
          hips?: number | null
          id?: string
          measured_at?: string
          metabolic_age?: number | null
          muscle_mass?: number | null
          neck?: number | null
          notes?: string | null
          protein_percentage?: number | null
          shoulders?: number | null
          thigh_left?: number | null
          thigh_right?: number | null
          updated_at?: string | null
          user_id: string
          visceral_fat?: number | null
          waist?: number | null
          water_percentage?: number | null
          weight?: number | null
        }
        Update: {
          bicep_left?: number | null
          bicep_right?: number | null
          bmr?: number | null
          body_fat_percentage?: number | null
          bone_mass?: number | null
          calf_left?: number | null
          calf_right?: number | null
          chest?: number | null
          created_at?: string | null
          forearm_left?: number | null
          forearm_right?: number | null
          height?: number | null
          hips?: number | null
          id?: string
          measured_at?: string
          metabolic_age?: number | null
          muscle_mass?: number | null
          neck?: number | null
          notes?: string | null
          protein_percentage?: number | null
          shoulders?: number | null
          thigh_left?: number | null
          thigh_right?: number | null
          updated_at?: string | null
          user_id?: string
          visceral_fat?: number | null
          waist?: number | null
          water_percentage?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          calories: number | null
          created_at: string
          distance: number | null
          distance_unit: string | null
          duration_minutes: number | null
          exercise_type: string | null
          id: string
          incline: number | null
          name: string
          notes: string | null
          reps: number | null
          resistance_level: number | null
          sets: number | null
          speed: number | null
          weight: number | null
          weight_unit: string | null
          workout_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string
          distance?: number | null
          distance_unit?: string | null
          duration_minutes?: number | null
          exercise_type?: string | null
          id?: string
          incline?: number | null
          name: string
          notes?: string | null
          reps?: number | null
          resistance_level?: number | null
          sets?: number | null
          speed?: number | null
          weight?: number | null
          weight_unit?: string | null
          workout_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string
          distance?: number | null
          distance_unit?: string | null
          duration_minutes?: number | null
          exercise_type?: string | null
          id?: string
          incline?: number | null
          name?: string
          notes?: string | null
          reps?: number | null
          resistance_level?: number | null
          sets?: number | null
          speed?: number | null
          weight?: number | null
          weight_unit?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          achieved: boolean | null
          created_at: string
          current_value: number | null
          description: string | null
          id: string
          initial_value: number
          target_date: string | null
          target_value: number
          title: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved?: boolean | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          initial_value?: number
          target_date?: string | null
          target_value: number
          title: string
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved?: boolean | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          initial_value?: number
          target_date?: string | null
          target_value?: number
          title?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          fitness_goals: string[] | null
          fitness_level: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          injuries: string | null
          medical_conditions: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          fitness_goals?: string[] | null
          fitness_level?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          injuries?: string | null
          medical_conditions?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          fitness_goals?: string[] | null
          fitness_level?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          injuries?: string | null
          medical_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_workout_preferences: {
        Row: {
          available_equipment: string[] | null
          avoid_days: number[] | null
          avoided_exercises: string[] | null
          constraints: string | null
          created_at: string | null
          default_gym_id: string | null
          fitness_level: string | null
          focus_areas: string[] | null
          gym_access: boolean | null
          gym_locations: Json | null
          injuries: string[] | null
          liked_exercises: string[] | null
          max_duration: number | null
          min_duration: number | null
          preferred_days: number[] | null
          preferred_duration: number | null
          preferred_time_of_day: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_equipment?: string[] | null
          avoid_days?: number[] | null
          avoided_exercises?: string[] | null
          constraints?: string | null
          created_at?: string | null
          default_gym_id?: string | null
          fitness_level?: string | null
          focus_areas?: string[] | null
          gym_access?: boolean | null
          gym_locations?: Json | null
          injuries?: string[] | null
          liked_exercises?: string[] | null
          max_duration?: number | null
          min_duration?: number | null
          preferred_days?: number[] | null
          preferred_duration?: number | null
          preferred_time_of_day?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_equipment?: string[] | null
          avoid_days?: number[] | null
          avoided_exercises?: string[] | null
          constraints?: string | null
          created_at?: string | null
          default_gym_id?: string | null
          fitness_level?: string | null
          focus_areas?: string[] | null
          gym_access?: boolean | null
          gym_locations?: Json | null
          injuries?: string[] | null
          liked_exercises?: string[] | null
          max_duration?: number | null
          min_duration?: number | null
          preferred_days?: number[] | null
          preferred_duration?: number | null
          preferred_time_of_day?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_workout_templates: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          equipment_needed: string[] | null
          estimated_duration: number | null
          exercises: Json
          id: string
          intensity_level: string | null
          is_active: boolean | null
          last_used_at: string | null
          name: string
          notes: string | null
          target_muscle_groups: string[] | null
          times_used: number | null
          updated_at: string | null
          user_id: string
          user_rating: number | null
          workout_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          intensity_level?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          notes?: string | null
          target_muscle_groups?: string[] | null
          times_used?: number | null
          updated_at?: string | null
          user_id: string
          user_rating?: number | null
          workout_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          intensity_level?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          notes?: string | null
          target_muscle_groups?: string[] | null
          times_used?: number | null
          updated_at?: string | null
          user_id?: string
          user_rating?: number | null
          workout_type?: string | null
        }
        Relationships: []
      }
      workout_plan_generation_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          plan_id: string | null
          request_data: Json
          status: Database["public"]["Enums"]["workout_plan_job_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          plan_id?: string | null
          request_data: Json
          status?: Database["public"]["Enums"]["workout_plan_job_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          plan_id?: string | null
          request_data?: Json
          status?: Database["public"]["Enums"]["workout_plan_job_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_generation_jobs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plan_generation_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plan_sessions: {
        Row: {
          completed_at: string | null
          completed_workout_id: string | null
          created_at: string
          day_name: string
          day_of_week: number
          estimated_duration: number | null
          exercises: Json
          id: string
          intensity_level: string | null
          muscle_groups: string[] | null
          notes: string | null
          plan_id: string
          session_order: number
          status: string
          updated_at: string
          week_number: number
          workout_name: string
          workout_template_id: string | null
          workout_type: string
        }
        Insert: {
          completed_at?: string | null
          completed_workout_id?: string | null
          created_at?: string
          day_name: string
          day_of_week: number
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          intensity_level?: string | null
          muscle_groups?: string[] | null
          notes?: string | null
          plan_id: string
          session_order?: number
          status?: string
          updated_at?: string
          week_number: number
          workout_name: string
          workout_template_id?: string | null
          workout_type: string
        }
        Update: {
          completed_at?: string | null
          completed_workout_id?: string | null
          created_at?: string
          day_name?: string
          day_of_week?: number
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          intensity_level?: string | null
          muscle_groups?: string[] | null
          notes?: string | null
          plan_id?: string
          session_order?: number
          status?: string
          updated_at?: string
          week_number?: number
          workout_name?: string
          workout_template_id?: string | null
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_sessions_completed_workout_id_fkey"
            columns: ["completed_workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plan_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plan_sessions_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          avg_workout_duration: number | null
          completed_at: string | null
          created_at: string
          description: string | null
          goal_id: string | null
          goal_type: string
          id: string
          name: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          weeks_duration: number
          workouts_per_week: number
        }
        Insert: {
          avg_workout_duration?: number | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          goal_id?: string | null
          goal_type: string
          id?: string
          name: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          weeks_duration?: number
          workouts_per_week?: number
        }
        Update: {
          avg_workout_duration?: number | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          goal_id?: string | null
          goal_type?: string
          id?: string
          name?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          weeks_duration?: number
          workouts_per_week?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_selfies: {
        Row: {
          caption: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          taken_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          taken_at?: string
          user_id: string
          workout_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          taken_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_selfies_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string | null
          equipment_needed: string[] | null
          estimated_duration: number | null
          exercises: Json
          id: string
          intensity_level: string | null
          is_active: boolean | null
          is_public: boolean
          last_used_at: string | null
          name: string
          tags: string[] | null
          target_muscle_groups: string[] | null
          times_used: number | null
          updated_at: string
          user_id: string | null
          workout_type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          intensity_level?: string | null
          is_active?: boolean | null
          is_public?: boolean
          last_used_at?: string | null
          name: string
          tags?: string[] | null
          target_muscle_groups?: string[] | null
          times_used?: number | null
          updated_at?: string
          user_id?: string | null
          workout_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          estimated_duration?: number | null
          exercises?: Json
          id?: string
          intensity_level?: string | null
          is_active?: boolean | null
          is_public?: boolean
          last_used_at?: string | null
          name?: string
          tags?: string[] | null
          target_muscle_groups?: string[] | null
          times_used?: number | null
          updated_at?: string
          user_id?: string | null
          workout_type?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          date: string
          description: string | null
          duration_minutes: number | null
          effort_level: number | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          duration_minutes?: number | null
          effort_level?: number | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes?: number | null
          effort_level?: number | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      workout_plan_job_status: "pending" | "processing" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      workout_plan_job_status: ["pending", "processing", "completed", "failed"],
    },
  },
} as const
