"use server";

import { revalidatePath } from "next/cache";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { Database } from "@/types/database";

type Workout = Database["public"]["Tables"]["workouts"]["Row"];

interface WorkoutResponse {
  success: boolean;
  workout_id?: string;
  workouts?: Workout[];
  error?: string;
}

interface ExerciseInput {
  name: string;
  type?: string;
  sets?: string;
  reps?: string;
  weight?: string;
  duration?: string;
  distance?: string;
  speed?: string;
  calories?: string;
  resistance?: string;
  incline?: string;
}

function parseExercises(exercisesJson: string) {
  let exercises: ExerciseInput[] = [];
  try {
    exercises = JSON.parse(exercisesJson);
  } catch {
    return [];
  }

  return exercises.map((ex) => ({
    name: ex.name,
    exercise_type: ex.type || "strength",
    sets: ex.sets ? Number.parseInt(ex.sets) : null,
    reps: ex.reps ? Number.parseInt(ex.reps) : null,
    weight: ex.weight ? Number.parseFloat(ex.weight) : null,
    weight_unit: "kg",
    duration_minutes: ex.duration ? Number.parseInt(ex.duration) : null,
    distance: ex.distance ? Number.parseFloat(ex.distance) : null,
    distance_unit: "km",
    speed: ex.speed ? Number.parseFloat(ex.speed) : null,
    calories: ex.calories ? Number.parseInt(ex.calories) : null,
    resistance_level: ex.resistance ? Number.parseInt(ex.resistance) : null,
    incline: ex.incline ? Number.parseFloat(ex.incline) : null,
  }));
}

export async function createWorkout(formData: FormData) {
  const exercisesJson = formData.get("exercises") as string;
  const exercises = parseExercises(exercisesJson);

  const data = {
    name: formData.get("name") as string,
    date: formData.get("date") as string,
    duration_minutes: formData.get("duration")
      ? Number.parseInt(formData.get("duration") as string)
      : null,
    description: formData.get("description") as string,
    effort_level: formData.get("effort_level")
      ? Number.parseInt(formData.get("effort_level") as string)
      : null,
    exercises,
    session_id: (formData.get("session_id") as string) || null,
  };

  const response = await apiPost<WorkoutResponse>("/api/workouts", data);

  if (!response.success) {
    return { error: response.error || "Failed to create workout" };
  }

  revalidatePath("/workouts");
  revalidatePath("/goals");
  revalidatePath("/progress");
  if (data.session_id) {
    revalidatePath("/workout-plans");
  }

  return { success: true, workoutId: response.data?.workout_id };
}

export async function getWorkouts(): Promise<{ workouts: Workout[] }> {
  const response = await apiGet<WorkoutResponse>("/api/workouts");
  return { workouts: response.data?.workouts || [] };
}

interface Exercise {
  id: string;
  name: string;
  exercise_type: string | null;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  weight_unit: string | null;
  duration_minutes: number | null;
  distance: number | null;
  distance_unit: string | null;
  speed: number | null;
  calories: number | null;
  resistance_level: number | null;
  incline: number | null;
  notes: string | null;
  created_at: string;
  workout_id: string;
}

interface WorkoutWithExercises extends Workout {
  exercises: Exercise[];
}

export async function getWorkout(
  workoutId: string
): Promise<{ workout: WorkoutWithExercises | null; error?: string }> {
  const response = await apiGet<WorkoutWithExercises>(
    `/api/workouts/${workoutId}`
  );

  if (!response.success) {
    return { workout: null, error: response.error || "Failed to fetch workout" };
  }

  return { workout: response.data || null };
}

export async function updateWorkout(workoutId: string, formData: FormData) {
  const exercisesJson = formData.get("exercises") as string;
  const exercises = parseExercises(exercisesJson);

  const data = {
    name: formData.get("name") as string,
    date: formData.get("date") as string,
    duration_minutes: formData.get("duration")
      ? Number.parseInt(formData.get("duration") as string)
      : null,
    description: formData.get("description") as string,
    effort_level: formData.get("effort_level")
      ? Number.parseInt(formData.get("effort_level") as string)
      : null,
    exercises,
  };

  const response = await apiPut<WorkoutResponse>(
    `/api/workouts/${workoutId}`,
    data
  );

  if (!response.success) {
    return { error: response.error || "Failed to update workout" };
  }

  revalidatePath("/workouts");
  revalidatePath(`/workouts/${workoutId}`);
  revalidatePath("/goals");
  revalidatePath("/progress");

  return { success: true };
}

export async function deleteWorkout(workoutId: string) {
  const response = await apiDelete<WorkoutResponse>(
    `/api/workouts/${workoutId}`
  );

  if (!response.success) {
    return { error: response.error || "Failed to delete workout" };
  }

  revalidatePath("/workouts");
  revalidatePath("/goals");
  revalidatePath("/progress");

  return { success: true };
}

export async function deleteExercise(exerciseId: string, workoutId: string) {
  const response = await apiDelete<WorkoutResponse>(
    `/api/workouts/${workoutId}/exercises/${exerciseId}`
  );

  if (!response.success) {
    return { error: response.error || "Failed to delete exercise" };
  }

  revalidatePath("/workouts");
  revalidatePath(`/workouts/${workoutId}`);

  return { success: true };
}
