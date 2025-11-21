-- =====================================================
-- CONSOLIDATED MIGRATION SCRIPT
-- Contains complete schema with all features and optimizations
-- Last updated: 2025-11-21
-- =====================================================

BEGIN;

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================
CREATE TYPE workout_plan_job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Trigger function for updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for auto-creating user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users for auto-profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TABLE: profiles
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height_cm DECIMAL(5,2),
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  fitness_goals TEXT[],
  medical_conditions TEXT,
  injuries TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TABLE: goals
-- =====================================================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  initial_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  target_value DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  target_date DATE,
  achieved BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_target_date ON public.goals(target_date);
CREATE INDEX idx_goals_user_deleted ON public.goals(user_id, deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TABLE: workout_plans
-- =====================================================
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight_loss', 'muscle_building', 'endurance', 'general_fitness')),
  weeks_duration INTEGER NOT NULL CHECK (weeks_duration BETWEEN 1 AND 12),
  workouts_per_week INTEGER NOT NULL CHECK (workouts_per_week BETWEEN 1 AND 7),
  avg_workout_duration INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  start_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_plans_user_id ON public.workout_plans(user_id);
CREATE INDEX idx_workout_plans_status ON public.workout_plans(status);
CREATE INDEX idx_workout_plans_goal_id ON public.workout_plans(goal_id);
CREATE INDEX idx_workout_plans_user_status ON public.workout_plans(user_id, status);
CREATE INDEX idx_workout_plans_start_date ON public.workout_plans(user_id, start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_workout_plans_user_deleted ON public.workout_plans(user_id, deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER update_workout_plans_updated_at
  BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TABLE: workout_templates
-- =====================================================
CREATE TABLE public.workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  workout_type TEXT CHECK (workout_type IN ('strength', 'cardio', 'mixed', 'flexibility', 'functional')),
  estimated_duration INTEGER,
  intensity_level TEXT CHECK (intensity_level IN ('low', 'medium', 'high')),
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  equipment_needed TEXT[],
  target_muscle_groups TEXT[],
  times_used INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_templates_user_id ON public.workout_templates(user_id);
CREATE INDEX idx_workout_templates_is_public ON public.workout_templates(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_workout_templates_workout_type ON public.workout_templates(workout_type);
CREATE INDEX idx_workout_templates_difficulty ON public.workout_templates(difficulty_level);
CREATE INDEX idx_workout_templates_active_user ON public.workout_templates(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_workout_templates_tags ON public.workout_templates USING GIN(tags);
CREATE INDEX idx_workout_templates_user_deleted ON public.workout_templates(user_id, deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER update_workout_templates_updated_at
  BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TABLE: workout_plan_sessions
-- =====================================================
CREATE TABLE public.workout_plan_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  day_name TEXT NOT NULL,
  session_order INTEGER NOT NULL DEFAULT 1 CHECK (session_order >= 1),
  actual_date DATE,
  workout_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  workout_name TEXT NOT NULL,
  workout_type TEXT NOT NULL CHECK (workout_type IN ('strength', 'cardio', 'rest', 'active_recovery', 'mixed')),
  estimated_duration INTEGER,
  exercises JSONB NOT NULL DEFAULT '[]',
  muscle_groups TEXT[],
  intensity_level TEXT CHECK (intensity_level IN ('low', 'moderate', 'high', 'max')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped', 'modified')),
  completed_workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plan_id, week_number, day_of_week, session_order)
);

CREATE INDEX idx_workout_plan_sessions_plan_id ON public.workout_plan_sessions(plan_id);
CREATE INDEX idx_workout_plan_sessions_week_day ON public.workout_plan_sessions(plan_id, week_number, day_of_week);
CREATE INDEX idx_workout_plan_sessions_status ON public.workout_plan_sessions(status);
CREATE INDEX idx_workout_plan_sessions_template_id ON public.workout_plan_sessions(workout_template_id);
CREATE INDEX idx_workout_plan_sessions_actual_date ON public.workout_plan_sessions(plan_id, actual_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_workout_plan_sessions_plan_deleted ON public.workout_plan_sessions(plan_id, deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER update_workout_plan_sessions_updated_at
  BEFORE UPDATE ON public.workout_plan_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TABLE: workouts
-- =====================================================
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  duration_minutes INTEGER,
  effort_level INTEGER CHECK (effort_level BETWEEN 1 AND 6),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_date ON public.workouts(date);
CREATE INDEX idx_workouts_user_deleted ON public.workouts(user_id, deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TABLE: exercises
-- =====================================================
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercise_type TEXT NOT NULL DEFAULT 'strength' CHECK (exercise_type IN ('strength', 'cardio', 'functional')),
  sets INTEGER,
  reps INTEGER,
  weight DECIMAL(10,2),
  weight_unit TEXT CHECK (weight_unit IN ('kg', 'lbs')),
  duration_minutes INTEGER,
  distance DECIMAL(10,2),
  distance_unit TEXT CHECK (distance_unit IN ('km', 'miles')),
  speed DECIMAL(10,2),
  calories INTEGER,
  resistance_level INTEGER,
  incline DECIMAL(10,2),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_workout_id ON public.exercises(workout_id);
CREATE INDEX idx_exercises_workout_deleted ON public.exercises(workout_id, deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLE: workout_selfies
-- =====================================================
CREATE TABLE public.workout_selfies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_selfies_workout_id ON public.workout_selfies(workout_id);
CREATE INDEX idx_workout_selfies_user_id ON public.workout_selfies(user_id);
CREATE INDEX idx_workout_selfies_taken_at ON public.workout_selfies(taken_at);
CREATE INDEX idx_workout_selfies_user_deleted ON public.workout_selfies(user_id, deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLE: body_measurements
-- =====================================================
CREATE TABLE public.body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight DECIMAL(10,2),
  body_fat_percentage DECIMAL(5,2),
  muscle_mass DECIMAL(10,2),
  bone_mass DECIMAL(10,2),
  water_percentage DECIMAL(5,2),
  height DECIMAL(5,2),
  neck DECIMAL(5,2),
  shoulders DECIMAL(5,2),
  chest DECIMAL(5,2),
  waist DECIMAL(5,2),
  hips DECIMAL(5,2),
  left_bicep DECIMAL(5,2),
  right_bicep DECIMAL(5,2),
  left_forearm DECIMAL(5,2),
  right_forearm DECIMAL(5,2),
  left_thigh DECIMAL(5,2),
  right_thigh DECIMAL(5,2),
  left_calf DECIMAL(5,2),
  right_calf DECIMAL(5,2),
  bmr INTEGER,
  metabolic_age INTEGER,
  visceral_fat INTEGER,
  protein_percentage DECIMAL(5,2),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_body_measurements_user_id_measured_at ON public.body_measurements(user_id, measured_at DESC);
CREATE INDEX idx_body_measurements_user_deleted ON public.body_measurements(user_id, deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- TABLE: user_workout_preferences
-- =====================================================
CREATE TABLE public.user_workout_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_exercises TEXT[],
  avoided_exercises TEXT[],
  available_equipment TEXT[],
  gym_access BOOLEAN NOT NULL DEFAULT FALSE,
  gym_locations JSONB,
  default_gym_id TEXT,
  preferred_duration INTEGER,
  min_duration INTEGER,
  max_duration INTEGER,
  focus_areas TEXT[],
  constraints TEXT,
  injuries TEXT[],
  preferred_days INTEGER[],
  avoid_days INTEGER[],
  preferred_time_of_day TEXT,
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_user_workout_preferences_updated_at
  BEFORE UPDATE ON public.user_workout_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TABLE: workout_plan_generation_jobs
-- =====================================================
CREATE TABLE public.workout_plan_generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status workout_plan_job_status NOT NULL DEFAULT 'pending',
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  error_message TEXT,
  request_data JSONB,
  ai_request_data JSONB,
  ai_response_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_plan_jobs_user_id ON public.workout_plan_generation_jobs(user_id);
CREATE INDEX idx_workout_plan_jobs_status ON public.workout_plan_generation_jobs(status);
CREATE INDEX idx_workout_plan_jobs_created_at ON public.workout_plan_generation_jobs(created_at DESC);
CREATE INDEX idx_workout_plan_jobs_ai_request ON public.workout_plan_generation_jobs USING GIN(ai_request_data);
CREATE INDEX idx_workout_plan_jobs_ai_response ON public.workout_plan_generation_jobs USING GIN(ai_response_data);

CREATE TRIGGER update_workout_plan_jobs_updated_at
  BEFORE UPDATE ON public.workout_plan_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Performance optimized with (SELECT auth.uid()) pattern
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_selfies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_generation_jobs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- profiles policies
-- -----------------------------------------------------
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO public
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO public
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO public
  WITH CHECK ((SELECT auth.uid()) = id);

-- -----------------------------------------------------
-- goals policies
-- -----------------------------------------------------
CREATE POLICY "Users can view their own goals"
  ON public.goals FOR SELECT TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own goals"
  ON public.goals FOR INSERT TO public
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.goals FOR UPDATE TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own goals"
  ON public.goals FOR DELETE TO public
  USING ((SELECT auth.uid()) = user_id);

-- -----------------------------------------------------
-- workout_plans policies
-- -----------------------------------------------------
CREATE POLICY "Users can view their own workout plans"
  ON public.workout_plans FOR SELECT TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own workout plans"
  ON public.workout_plans FOR INSERT TO public
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own workout plans"
  ON public.workout_plans FOR UPDATE TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own workout plans"
  ON public.workout_plans FOR DELETE TO public
  USING ((SELECT auth.uid()) = user_id);

-- -----------------------------------------------------
-- workout_templates policies
-- -----------------------------------------------------
CREATE POLICY "Users can view their own and public workout templates"
  ON public.workout_templates FOR SELECT TO public
  USING (((SELECT auth.uid()) = user_id) OR (is_public = true));

CREATE POLICY "Users can create their own templates"
  ON public.workout_templates FOR INSERT TO public
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.workout_templates FOR UPDATE TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.workout_templates FOR DELETE TO public
  USING ((SELECT auth.uid()) = user_id);

-- -----------------------------------------------------
-- workout_plan_sessions policies
-- -----------------------------------------------------
CREATE POLICY "Users can view sessions from their own plans"
  ON public.workout_plan_sessions FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = workout_plan_sessions.plan_id
      AND workout_plans.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can create sessions in their own plans"
  ON public.workout_plan_sessions FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = workout_plan_sessions.plan_id
      AND workout_plans.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update sessions in their own plans"
  ON public.workout_plan_sessions FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = workout_plan_sessions.plan_id
      AND workout_plans.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete sessions from their own plans"
  ON public.workout_plan_sessions FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE workout_plans.id = workout_plan_sessions.plan_id
      AND workout_plans.user_id = (SELECT auth.uid())
  ));

-- -----------------------------------------------------
-- workouts policies
-- -----------------------------------------------------
CREATE POLICY "Users can view their own workouts"
  ON public.workouts FOR SELECT TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own workouts"
  ON public.workouts FOR INSERT TO public
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own workouts"
  ON public.workouts FOR UPDATE TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON public.workouts FOR DELETE TO public
  USING ((SELECT auth.uid()) = user_id);

-- -----------------------------------------------------
-- exercises policies
-- -----------------------------------------------------
CREATE POLICY "Users can view exercises from their workouts"
  ON public.exercises FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.workouts
    WHERE workouts.id = exercises.workout_id
      AND workouts.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can create exercises in their workouts"
  ON public.exercises FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workouts
    WHERE workouts.id = exercises.workout_id
      AND workouts.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update exercises in their workouts"
  ON public.exercises FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM public.workouts
    WHERE workouts.id = exercises.workout_id
      AND workouts.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete exercises from their workouts"
  ON public.exercises FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM public.workouts
    WHERE workouts.id = exercises.workout_id
      AND workouts.user_id = (SELECT auth.uid())
  ));

-- -----------------------------------------------------
-- workout_selfies policies
-- -----------------------------------------------------
CREATE POLICY "Users can view their own workout selfies"
  ON public.workout_selfies FOR SELECT TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own workout selfies"
  ON public.workout_selfies FOR INSERT TO public
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own workout selfies"
  ON public.workout_selfies FOR UPDATE TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own workout selfies"
  ON public.workout_selfies FOR DELETE TO public
  USING ((SELECT auth.uid()) = user_id);

-- -----------------------------------------------------
-- body_measurements policies
-- -----------------------------------------------------
CREATE POLICY "Users can view their own measurements"
  ON public.body_measurements FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own measurements"
  ON public.body_measurements FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own measurements"
  ON public.body_measurements FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own measurements"
  ON public.body_measurements FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- -----------------------------------------------------
-- user_workout_preferences policies
-- -----------------------------------------------------
CREATE POLICY "Users can view own preferences"
  ON public.user_workout_preferences FOR SELECT TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_workout_preferences FOR INSERT TO public
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_workout_preferences FOR UPDATE TO public
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own preferences"
  ON public.user_workout_preferences FOR DELETE TO public
  USING ((SELECT auth.uid()) = user_id);

-- -----------------------------------------------------
-- workout_plan_generation_jobs policies
-- -----------------------------------------------------
CREATE POLICY "Users can view their own generation jobs"
  ON public.workout_plan_generation_jobs FOR SELECT TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own generation jobs"
  ON public.workout_plan_generation_jobs FOR INSERT TO public
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- =====================================================
-- STORAGE POLICIES (workout-selfies bucket)
-- Note: Storage bucket 'workout-selfies' must be created manually
-- =====================================================

-- Storage INSERT policy
CREATE POLICY "Users can upload their own workout selfies"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'workout-selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage SELECT policy
CREATE POLICY "Users can view their own workout selfies"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'workout-selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage UPDATE policy
CREATE POLICY "Users can update their own workout selfies"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'workout-selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage DELETE policy
CREATE POLICY "Users can delete their own workout selfies"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'workout-selfies'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================
-- SEED DATA: Public Workout Templates
-- =====================================================

INSERT INTO public.workout_templates (id, user_id, name, description, exercises, is_public, workout_type, estimated_duration, intensity_level, difficulty_level, equipment_needed, target_muscle_groups) VALUES

-- StrongLifts 5x5 - Workout A
('00000000-0000-0000-0000-000000000001', NULL, 'StrongLifts 5x5 - Workout A', 'Classic compound lifting program. Research shows 5x5 protocols effective for strength and hypertrophy. Focus on progressive overload: add 2.5kg to upper body, 5kg to lower body lifts each session.',
'[
  {"name": "Squat", "sets": 5, "reps": 5, "rest_seconds": 180, "notes": "Core lift. Keep bar over mid-foot, chest up, knees tracking over toes. Depth: hip crease below knee. Start: 20kg bar only if new."},
  {"name": "Bench Press", "sets": 5, "reps": 5, "rest_seconds": 180, "notes": "Retract scapula, arch back slightly, feet planted. Lower to mid-chest, press explosively. Use spotter for safety."},
  {"name": "Barbell Row", "sets": 5, "reps": 5, "rest_seconds": 180, "notes": "Pull bar to lower chest/upper abdomen. Keep torso ~30-45° angle. Squeeze shoulder blades at top. No momentum."}
]', TRUE, 'strength', 45, 'high', 'intermediate', ARRAY['barbell', 'bench', 'squat_rack'], ARRAY['legs', 'chest', 'back']),

-- StrongLifts 5x5 - Workout B
('00000000-0000-0000-0000-000000000002', NULL, 'StrongLifts 5x5 - Workout B', 'Alternate with Workout A (e.g., Mon/Wed/Fri rotating). Overhead Press and Deadlift complete the big compound movements. Proven strength program backed by decades of powerlifting science.',
'[
  {"name": "Squat", "sets": 5, "reps": 5, "rest_seconds": 180, "notes": "Same form as Workout A. Frequency builds technique and leg strength rapidly."},
  {"name": "Overhead Press", "sets": 5, "reps": 5, "rest_seconds": 180, "notes": "Stand tall, core tight. Press bar straight up, lean head back slightly as bar passes face. Lock out overhead. Most challenging press—expect slower progress."},
  {"name": "Deadlift", "sets": 1, "reps": 5, "rest_seconds": 300, "notes": "Only ONE heavy set. Most taxing lift. Hinge at hips, neutral spine, push floor away with legs. Reset each rep. Do NOT bounce."}
]', TRUE, 'strength', 45, 'high', 'intermediate', ARRAY['barbell', 'squat_rack'], ARRAY['legs', 'shoulders', 'back']),

-- PPL Push
('00000000-0000-0000-0000-000000000003', NULL, 'PPL - Push Day', 'Push/Pull/Legs split: Day 1. Targets chest, shoulders, triceps. High volume (8-12 reps) optimizes hypertrophy per research (Schoenfeld et al.). Run PPL 2x/week (6 days) for best results.',
'[
  {"name": "Flat Barbell Bench Press", "sets": 4, "reps": "8-10", "rest_seconds": 120, "notes": "Primary chest builder. Progressive overload key. Track weights."},
  {"name": "Overhead Dumbbell Press", "sets": 4, "reps": "8-12", "rest_seconds": 90, "notes": "Deltoid focus. DBs allow natural movement path, reduce shoulder strain vs barbell."},
  {"name": "Incline Dumbbell Press", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Upper chest emphasis. 30-45° incline ideal."},
  {"name": "Cable Flyes", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Chest stretch and contraction. Constant tension from cables."},
  {"name": "Lateral Raises", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Medial delt isolation. Light weight, control, slight lean forward."},
  {"name": "Overhead Tricep Extension", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Tricep stretch under load. Use rope or EZ bar."},
  {"name": "Tricep Pushdown", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Tricep pump finisher. Keep elbows tucked."}
]', TRUE, 'strength', 60, 'high', 'intermediate', ARRAY['barbell', 'dumbbells', 'cable_machine', 'bench'], ARRAY['chest', 'shoulders', 'triceps']),

-- PPL Pull
('00000000-0000-0000-0000-000000000004', NULL, 'PPL - Pull Day', 'Push/Pull/Legs split: Day 2. Targets back, biceps, rear delts. Balanced pulling volume prevents shoulder imbalances and builds thick back.',
'[
  {"name": "Deadlift", "sets": 3, "reps": "5-8", "rest_seconds": 180, "notes": "King of back exercises. Conventional or sumo. Lower reps due to CNS demand."},
  {"name": "Pull-Ups", "sets": 4, "reps": "8-10", "rest_seconds": 90, "notes": "Best lat builder. Use assistance or add weight as needed. Full ROM."},
  {"name": "Barbell Row", "sets": 4, "reps": "8-10", "rest_seconds": 90, "notes": "Mid-back thickness. Pull to sternum, squeeze lats."},
  {"name": "Face Pulls", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Rear delt and upper back health. Pull to face, externally rotate shoulders."},
  {"name": "Dumbbell Curl", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Classic bicep builder. Supinate fully at top."},
  {"name": "Hammer Curl", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Brachialis and forearm emphasis. Neutral grip."},
  {"name": "Shrugs", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Trap development. Hold peak contraction 1-2 sec."}
]', TRUE, 'strength', 60, 'high', 'intermediate', ARRAY['barbell', 'dumbbells', 'pull_up_bar', 'cable_machine'], ARRAY['back', 'biceps', 'traps']),

-- PPL Legs
('00000000-0000-0000-0000-000000000005', NULL, 'PPL - Leg Day', 'Push/Pull/Legs split: Day 3. Complete lower body: quads, hamstrings, glutes, calves. Leg training crucial for overall strength and hormone response.',
'[
  {"name": "Back Squat", "sets": 4, "reps": "8-10", "rest_seconds": 180, "notes": "Quad and glute primary. High-bar for quads, low-bar for posterior chain."},
  {"name": "Romanian Deadlift", "sets": 4, "reps": "8-10", "rest_seconds": 120, "notes": "Hamstring and glute focus. Slight knee bend, hinge at hips, feel stretch."},
  {"name": "Leg Press", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Quad volume without spinal load. Feet shoulder-width, full ROM."},
  {"name": "Leg Curl", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Hamstring isolation. Control eccentric (lowering)."},
  {"name": "Walking Lunges", "sets": 3, "reps": "12 per leg", "rest_seconds": 90, "notes": "Unilateral work, balance, glute activation. Use DBs or barbell."},
  {"name": "Standing Calf Raise", "sets": 4, "reps": "12-15", "rest_seconds": 60, "notes": "Gastrocnemius focus. Full stretch, full contraction. Pause at top."},
  {"name": "Seated Calf Raise", "sets": 3, "reps": "15-20", "rest_seconds": 60, "notes": "Soleus focus. Higher reps, constant tension."}
]', TRUE, 'strength', 60, 'high', 'intermediate', ARRAY['barbell', 'dumbbells', 'leg_press', 'leg_curl_machine', 'calf_machine', 'squat_rack'], ARRAY['legs', 'glutes', 'calves']),

-- HIIT Circuit
('00000000-0000-0000-0000-000000000006', NULL, 'HIIT Circuit - Fat Burner', 'High-Intensity Interval Training for fat loss and conditioning. Research: HIIT burns calories post-workout (EPOC). 30 sec work / 15 sec rest. 3-4 rounds. Minimal equipment.',
'[
  {"name": "Burpees", "duration_seconds": 30, "rest_seconds": 15, "notes": "Full-body explosive movement. Chest to ground, jump at top. Scale: step back instead of jump."},
  {"name": "Mountain Climbers", "duration_seconds": 30, "rest_seconds": 15, "notes": "Core and cardio. Plank position, drive knees to chest rapidly. Keep hips level."},
  {"name": "Jump Squats", "duration_seconds": 30, "rest_seconds": 15, "notes": "Explosive power. Squat depth, explode up, soft landing. Scale: regular squats."},
  {"name": "Push-Ups", "duration_seconds": 30, "rest_seconds": 15, "notes": "Upper body push. Full ROM. Scale: knee push-ups or incline."},
  {"name": "High Knees", "duration_seconds": 30, "rest_seconds": 15, "notes": "Cardio burst. Run in place, knees to hip height. Fast cadence."},
  {"name": "Plank", "duration_seconds": 30, "rest_seconds": 60, "notes": "Core finisher. Hold strong position. Rest 60 sec before next round."}
]', TRUE, 'cardio', 20, 'high', 'beginner', ARRAY['bodyweight'], ARRAY['full_body', 'core']),

-- HIIT Running
('00000000-0000-0000-0000-000000000007', NULL, 'HIIT Cardio - Running Intervals', 'Treadmill or outdoor sprint intervals. Improves VO2 max and anaerobic capacity. Warm up 5 min easy, cool down 5 min. Total: ~25-30 min. Max 2-3x/week to avoid overtraining.',
'[
  {"name": "Warm-up Jog", "duration_minutes": 5, "intensity": "50-60% max effort", "notes": "Prepare body for high intensity. Gradually increase pace."},
  {"name": "Sprint Interval", "duration_seconds": 30, "intensity": "85-95% max effort", "rest_seconds": 90, "notes": "Near-max sprint. Repeat 8-10 times. Treadmill: increase speed significantly. Outdoor: landmarks."},
  {"name": "Active Recovery", "duration_seconds": 90, "intensity": "40-50% max effort", "notes": "Walk or light jog between sprints. Catch breath but stay moving."},
  {"name": "Cool-down Jog", "duration_minutes": 5, "intensity": "40-50% max effort", "notes": "Gradually decrease pace. Allow heart rate to lower. Static stretch after."}
]', TRUE, 'cardio', 25, 'high', 'intermediate', ARRAY['treadmill'], ARRAY['cardio']),

-- Full Body Beginner
('00000000-0000-0000-0000-000000000008', NULL, 'Full Body Beginner', 'Perfect starting point for new lifters. Hits all major muscle groups 3x/week. Focus on learning movement patterns and building base strength. Add weight slowly—form over ego.',
'[
  {"name": "Goblet Squat", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Hold dumbbell at chest. Teaches squat pattern, upright torso. Great for mobility."},
  {"name": "Dumbbell Bench Press", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Safer than barbell for beginners. Natural arm path. Build stability."},
  {"name": "Dumbbell Row", "sets": 3, "reps": "10-12 per arm", "rest_seconds": 60, "notes": "Single-arm, support on bench. Pull to hip, squeeze shoulder blade. Core engagement."},
  {"name": "Dumbbell Shoulder Press", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Seated or standing. Press overhead, lock out. Core tight."},
  {"name": "Romanian Deadlift (Dumbbell)", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Hip hinge pattern crucial to learn. Feel hamstring stretch."},
  {"name": "Plank", "sets": 3, "duration_seconds": 30, "rest_seconds": 60, "notes": "Core stability foundation. Straight line head to heels. Progress duration over time."}
]', TRUE, 'strength', 45, 'medium', 'beginner', ARRAY['dumbbells', 'bench'], ARRAY['full_body']),

-- Metabolic Conditioning
('00000000-0000-0000-0000-000000000009', NULL, 'Metabolic Conditioning', 'High-rep, moderate weight circuit for conditioning and work capacity. Improves muscular endurance and cardiovascular fitness. Minimal rest = metabolic stress. 3-4 rounds.',
'[
  {"name": "Kettlebell Swings", "reps": 20, "rest_seconds": 30, "notes": "Hip hinge power. Explosive hip drive. KB to chest/eye level."},
  {"name": "Dumbbell Thrusters", "reps": 15, "rest_seconds": 30, "notes": "Front squat into overhead press. One fluid motion. Full-body burner."},
  {"name": "Box Jumps", "reps": 12, "rest_seconds": 30, "notes": "Explosive triple extension. Step down to reduce impact. Scale height as needed."},
  {"name": "Renegade Rows", "reps": "10 per arm", "rest_seconds": 30, "notes": "Plank position, row DB. Minimize rotation. Core + back."},
  {"name": "Battle Ropes", "duration_seconds": 30, "rest_seconds": 60, "notes": "Alternating waves or slams. Upper body cardio. Full effort. Rest 60 sec before next round."}
]', TRUE, 'mixed', 30, 'high', 'advanced', ARRAY['kettlebell', 'dumbbells', 'box', 'battle_ropes'], ARRAY['full_body', 'cardio']),

-- Core Strength
('00000000-0000-0000-0000-000000000010', NULL, 'Core Strength & Stability', 'Comprehensive core workout targeting all planes of motion. Strong core = injury prevention, better lifts, functional fitness. 2-3x/week. Can be added after main workout.',
'[
  {"name": "Dead Bug", "sets": 3, "reps": "10 per side", "rest_seconds": 45, "notes": "Anti-extension. Opposite arm/leg extend, keep lower back flat on floor. Slow and controlled."},
  {"name": "Pallof Press", "sets": 3, "reps": "12 per side", "rest_seconds": 45, "notes": "Anti-rotation. Press cable/band away from chest, resist rotation. Core braced."},
  {"name": "Hanging Leg Raises", "sets": 3, "reps": "10-15", "rest_seconds": 60, "notes": "Lower ab focus. Raise legs to 90°, control down. No swinging. Scale: knee raises."},
  {"name": "Ab Wheel Rollout", "sets": 3, "reps": "8-12", "rest_seconds": 60, "notes": "Advanced anti-extension. Roll out, maintain neutral spine. Scale: from knees or shorter ROM."},
  {"name": "Side Plank", "sets": 3, "duration_seconds": "30 per side", "rest_seconds": 45, "notes": "Lateral stability. Straight line, top hip high. Progress: leg raise or add weight."},
  {"name": "Russian Twists", "sets": 3, "reps": 20, "rest_seconds": 60, "notes": "Rotational. Hold weight, feet elevated, twist torso. Control movement."}
]', TRUE, 'functional', 30, 'medium', 'intermediate', ARRAY['cable_machine', 'ab_wheel', 'medicine_ball'], ARRAY['core', 'abs']);

COMMIT;

-- =====================================================
-- POST-MIGRATION NOTES
-- =====================================================
-- 1. Storage bucket 'workout-selfies' must be created manually in Supabase dashboard
-- 2. All soft delete functionality is implemented via deleted_at timestamp
-- 3. RLS policies use (SELECT auth.uid()) pattern for better query performance
-- 4. Remember to add deleted_at IS NULL filters in application queries
-- 5. Public workout templates are seeded and ready to use
-- =====================================================
