"use server";

import { revalidatePath } from "next/cache";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { Database } from "@/types/database";

type Goal = Database["public"]["Tables"]["goals"]["Row"];

interface GoalResponse {
  success: boolean;
  goal_id?: string;
  goals?: Goal[];
  error?: string;
}

export async function createGoal(formData: FormData) {
  const data = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    target_value: Number.parseFloat(formData.get("target_value") as string),
    current_value: formData.get("current_value")
      ? Number.parseFloat(formData.get("current_value") as string)
      : 0,
    unit: formData.get("unit") as string,
    target_date: (formData.get("target_date") as string) || null,
  };

  const response = await apiPost<GoalResponse>("/api/goals", data);

  if (!response.success) {
    return { error: response.error || "Failed to create goal" };
  }

  revalidatePath("/goals");
  return { success: true, goalId: response.data?.goal_id };
}

export async function getGoals(): Promise<{ goals: Goal[] }> {
  const response = await apiGet<GoalResponse>("/api/goals");
  return { goals: response.data?.goals || [] };
}

export async function updateGoal(goalId: string, formData: FormData) {
  const data: Record<string, unknown> = {};

  const title = formData.get("title");
  if (title) data.title = title;

  const description = formData.get("description");
  if (description !== null) data.description = description;

  const targetValue = formData.get("target_value");
  if (targetValue) data.target_value = Number.parseFloat(targetValue as string);

  const currentValue = formData.get("current_value");
  if (currentValue)
    data.current_value = Number.parseFloat(currentValue as string);

  const unit = formData.get("unit");
  if (unit) data.unit = unit;

  const targetDate = formData.get("target_date");
  if (targetDate !== null) data.target_date = targetDate || null;

  const response = await apiPut<GoalResponse>(`/api/goals/${goalId}`, data);

  if (!response.success) {
    return { error: response.error || "Failed to update goal" };
  }

  revalidatePath("/goals");
  return { success: true };
}

export async function updateGoalProgress(goalId: string, currentValue: number) {
  const response = await apiPut<GoalResponse>(`/api/goals/${goalId}/progress`, {
    current_value: currentValue,
  });

  if (!response.success) {
    return { error: response.error || "Failed to update progress" };
  }

  revalidatePath("/goals");
  return { success: true };
}

export async function deleteGoal(goalId: string) {
  const response = await apiDelete<GoalResponse>(`/api/goals/${goalId}`);

  if (!response.success) {
    return { error: response.error || "Failed to delete goal" };
  }

  revalidatePath("/goals");
  return { success: true };
}
