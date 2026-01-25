/**
 * Client-side API helpers for making requests to the Next.js API routes.
 * These requests will be visible in the browser's Network tab.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Make a client-side fetch request to our API routes.
 */
async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.detail || "Request failed",
      };
    }

    return { success: true, data: data as T };
  } catch (error) {
    console.error(`API fetch failed: ${path}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

// ============ Goals API ============

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  initial_value?: number | null;
  current_value?: number | null;
  target_value: number;
  unit: string;
  target_date?: string | null;
  achieved: boolean;
  status?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export async function fetchGoals(): Promise<ApiResponse<{ goals: Goal[] }>> {
  return apiFetch("/api/goals");
}

export async function createGoal(
  data: Partial<Goal>
): Promise<ApiResponse<{ goal_id: string }>> {
  return apiFetch("/api/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateGoal(
  goalId: string,
  data: Partial<Goal>
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/goals/${goalId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateGoalProgress(
  goalId: string,
  currentValue: number
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/goals/${goalId}/progress`, {
    method: "PUT",
    body: JSON.stringify({ current_value: currentValue }),
  });
}

export async function deleteGoal(
  goalId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/goals/${goalId}`, { method: "DELETE" });
}

// ============ Workouts API ============

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  date: string;
  duration_minutes?: number | null;
  description?: string | null;
  effort_level?: number | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export async function fetchWorkouts(): Promise<
  ApiResponse<{ workouts: Workout[] }>
> {
  return apiFetch("/api/workouts");
}

export async function fetchWorkout(
  workoutId: string
): Promise<ApiResponse<Workout>> {
  return apiFetch(`/api/workouts/${workoutId}`);
}

export async function createWorkout(
  data: Partial<Workout> & { exercises?: unknown[] }
): Promise<ApiResponse<{ workout_id: string }>> {
  return apiFetch("/api/workouts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateWorkout(
  workoutId: string,
  data: Partial<Workout> & { exercises?: unknown[] }
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/workouts/${workoutId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteWorkout(
  workoutId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/workouts/${workoutId}`, { method: "DELETE" });
}

export async function deleteExercise(
  workoutId: string,
  exerciseId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/workouts/${workoutId}/exercises/${exerciseId}`, {
    method: "DELETE",
  });
}

// ============ Measurements API ============

export interface Measurement {
  id: string;
  user_id: string;
  measured_at: string;
  weight?: number | null;
  body_fat_percentage?: number | null;
  muscle_mass?: number | null;
  // ... other fields
  created_at: string;
  updated_at: string;
}

export async function fetchMeasurements(
  limit?: number
): Promise<ApiResponse<{ measurements: Measurement[] }>> {
  const path = limit ? `/api/measurements?limit=${limit}` : "/api/measurements";
  return apiFetch(path);
}

export async function fetchLatestMeasurement(): Promise<
  ApiResponse<{ measurement: Measurement | null }>
> {
  return apiFetch("/api/measurements/latest");
}

export async function createMeasurement(
  data: Partial<Measurement>
): Promise<ApiResponse<{ data: Measurement }>> {
  return apiFetch("/api/measurements", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMeasurement(
  measurementId: string,
  data: Partial<Measurement>
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/measurements/${measurementId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMeasurement(
  measurementId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/measurements/${measurementId}`, { method: "DELETE" });
}

// ============ Profile API ============

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  height_cm?: number | null;
  fitness_level?: string | null;
  theme?: string | null;
  accent_theme?: string | null;
  weight_unit?: string | null;
  distance_unit?: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchProfile(): Promise<
  ApiResponse<{ profile: Profile }>
> {
  return apiFetch("/api/profile");
}

export async function updateProfile(
  data: Partial<Profile>
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch("/api/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ============ Selfies API ============

export interface Selfie {
  id: string;
  workout_id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  caption?: string | null;
  taken_at: string;
  created_at: string;
}

export async function fetchWorkoutSelfies(
  workoutId: string
): Promise<ApiResponse<{ selfies: Selfie[] }>> {
  return apiFetch(`/api/workouts/${workoutId}/selfie`);
}

export async function fetchRecentSelfies(
  limit: number = 10
): Promise<ApiResponse<{ selfies: Selfie[] }>> {
  return apiFetch(`/api/selfies/recent?limit=${limit}`);
}

export async function deleteSelfie(
  selfieId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/selfies/${selfieId}`, { method: "DELETE" });
}

export async function updateSelfieCaption(
  selfieId: string,
  caption: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/selfies/${selfieId}/caption`, {
    method: "PUT",
    body: JSON.stringify({ caption }),
  });
}

export async function fetchSelfieUrl(
  filePath: string
): Promise<ApiResponse<{ url: string }>> {
  return apiFetch(`/api/selfies/url?path=${encodeURIComponent(filePath)}`);
}

// ============ Workout Plans API ============

export interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  goal_type: string;
  weeks_duration: number;
  workouts_per_week: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function fetchWorkoutPlans(): Promise<
  ApiResponse<{ plans: WorkoutPlan[] }>
> {
  return apiFetch("/api/workout-plans");
}

export async function fetchWorkoutPlan(
  planId: string
): Promise<ApiResponse<WorkoutPlan>> {
  return apiFetch(`/api/workout-plans/${planId}`);
}

export async function createWorkoutPlan(
  data: Partial<WorkoutPlan>
): Promise<ApiResponse<{ plan: WorkoutPlan }>> {
  return apiFetch("/api/workout-plans", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateWorkoutPlan(
  planId: string,
  data: Partial<WorkoutPlan>
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/workout-plans/${planId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteWorkoutPlan(
  planId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/workout-plans/${planId}`, { method: "DELETE" });
}

export async function activateWorkoutPlan(
  planId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/workout-plans/${planId}/activate`, { method: "POST" });
}

export async function deactivateWorkoutPlan(
  planId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiFetch(`/api/workout-plans/${planId}/deactivate`, { method: "POST" });
}
