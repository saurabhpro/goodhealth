"use server";

import { revalidatePath } from "next/cache";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { InsertWorkoutPlan, UpdateWorkoutPlan, WorkoutPlan, WorkoutPlanSession } from "@/types";

interface PlanResponse {
  success: boolean;
  plan?: WorkoutPlan;
  plans?: WorkoutPlan[];
  error?: string;
}

interface SessionsResponse {
  sessions?: WorkoutPlanSession[];
  current_week?: number;
}

export async function createWorkoutPlan(
  data: Omit<InsertWorkoutPlan, "user_id">
) {
  const response = await apiPost<PlanResponse>("/api/workout-plans", data);

  if (!response.success) {
    return { error: response.error || "Failed to create workout plan" };
  }

  revalidatePath("/workout-plans");
  return { success: true, plan: response.data?.plan };
}

export async function getWorkoutPlans(): Promise<{ plans: WorkoutPlan[] }> {
  const response = await apiGet<PlanResponse>("/api/workout-plans");
  return { plans: response.data?.plans || [] };
}

export async function getWorkoutPlan(planId: string) {
  const response = await apiGet<PlanResponse>(`/api/workout-plans/${planId}`);

  if (!response.success) {
    return { error: response.error || "Plan not found" };
  }

  return { plan: response.data };
}

export async function updateWorkoutPlan(
  planId: string,
  data: UpdateWorkoutPlan
) {
  const response = await apiPut<PlanResponse>(
    `/api/workout-plans/${planId}`,
    data
  );

  if (!response.success) {
    return { error: response.error || "Failed to update workout plan" };
  }

  revalidatePath("/workout-plans");
  revalidatePath(`/workout-plans/${planId}`);
  return { success: true, plan: response.data?.plan };
}

export async function deleteWorkoutPlan(planId: string) {
  const response = await apiDelete<PlanResponse>(`/api/workout-plans/${planId}`);

  if (!response.success) {
    return { error: response.error || "Failed to delete workout plan" };
  }

  revalidatePath("/workout-plans");
  return { success: true };
}

export async function activateWorkoutPlan(planId: string) {
  const response = await apiPost<PlanResponse>(
    `/api/workout-plans/${planId}/activate`,
    {}
  );

  if (!response.success) {
    return { error: response.error || "Failed to activate workout plan" };
  }

  revalidatePath("/workout-plans");
  revalidatePath(`/workout-plans/${planId}`);
  return { success: true, plan: response.data?.plan };
}

export async function completeWorkoutPlan(planId: string) {
  const response = await apiPost<PlanResponse>(
    `/api/workout-plans/${planId}/complete`,
    {}
  );

  if (!response.success) {
    return { error: response.error || "Failed to complete workout plan" };
  }

  revalidatePath("/workout-plans");
  revalidatePath(`/workout-plans/${planId}`);
  return { success: true, plan: response.data?.plan };
}

export async function deactivateWorkoutPlan(planId: string) {
  const response = await apiPost<PlanResponse>(
    `/api/workout-plans/${planId}/deactivate`,
    {}
  );

  if (!response.success) {
    return { error: response.error || "Failed to deactivate workout plan" };
  }

  revalidatePath("/workout-plans");
  revalidatePath(`/workout-plans/${planId}`);
  revalidatePath("/dashboard");
  return { success: true, plan: response.data?.plan };
}

export async function getCurrentWeekSessions(): Promise<{ sessions: WorkoutPlanSession[]; currentWeek: number }> {
  const response = await apiGet<SessionsResponse>(
    "/api/workout-plans/current-week"
  );

  return {
    sessions: response.data?.sessions || [],
    currentWeek: response.data?.current_week || 1,
  };
}
