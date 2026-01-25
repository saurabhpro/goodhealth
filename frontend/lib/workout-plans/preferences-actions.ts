"use server";

import { revalidatePath } from "next/cache";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { UserWorkoutPreferences, WorkoutTemplate } from "@/types";

interface PreferencesResponse {
  preferences?: UserWorkoutPreferences;
  error?: string;
}

interface TemplatesResponse {
  templates?: WorkoutTemplate[];
  template?: WorkoutTemplate;
  template_id?: string;
  error?: string;
}

export async function getUserPreferences() {
  const response = await apiGet<PreferencesResponse>(
    "/api/workout-plans/preferences"
  );
  if (!response.success) {
    return { preferences: null, error: response.error || "Failed to load preferences" };
  }
  return { preferences: response.data?.preferences, error: null };
}

export async function upsertUserPreferences(preferences: unknown) {
  const response = await apiPut<PreferencesResponse>(
    "/api/workout-plans/preferences",
    preferences
  );

  if (!response.success) {
    return { error: response.error || "Failed to save preferences" };
  }

  revalidatePath("/workout-plans");
  return { success: true };
}

export async function getUserTemplates(options?: { isActive?: boolean }) {
  const params = new URLSearchParams();
  if (options?.isActive !== undefined) {
    params.set("is_active", String(options.isActive));
  }
  const queryString = params.toString();
  const path = queryString
    ? `/api/workout-plans/templates?${queryString}`
    : "/api/workout-plans/templates";

  const response = await apiGet<TemplatesResponse>(path);
  if (!response.success) {
    return { templates: [], error: response.error || "Failed to load templates" };
  }
  return { templates: response.data?.templates || [], error: null };
}

export async function createUserTemplate(template: unknown) {
  const response = await apiPost<TemplatesResponse>(
    "/api/workout-plans/templates",
    template
  );

  if (!response.success) {
    return { error: response.error || "Failed to create template" };
  }

  revalidatePath("/workout-plans/templates");
  return { success: true, templateId: response.data?.template_id };
}

export async function deleteUserTemplate(templateId: string) {
  const response = await apiDelete<TemplatesResponse>(
    `/api/workout-plans/templates/${templateId}`
  );

  if (!response.success) {
    return { error: response.error || "Failed to delete template" };
  }

  revalidatePath("/workout-plans/templates");
  return { success: true };
}
