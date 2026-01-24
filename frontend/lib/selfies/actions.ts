"use server";

import { revalidatePath } from "next/cache";
import { apiDelete, apiGet, apiPut, apiUpload } from "@/lib/api/client";
import type { Database } from "@/types/database";

type WorkoutSelfie = Database["public"]["Tables"]["workout_selfies"]["Row"];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

interface SelfieResponse {
  success: boolean;
  selfie_id?: string;
  selfies?: WorkoutSelfie[];
  error?: string;
}

export async function uploadWorkoutSelfie(
  workoutId: string,
  file: File,
  caption?: string
) {
  // Validate file locally first
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File size must be less than 5MB" };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: "File must be a valid image (JPEG, PNG, WebP, or HEIC)" };
  }

  const response = await apiUpload<SelfieResponse>(
    `/api/workouts/${workoutId}/selfie`,
    file,
    caption ? { caption } : undefined
  );

  if (!response.success) {
    return { error: response.error || "Failed to upload selfie" };
  }

  revalidatePath("/workouts");
  revalidatePath(`/workouts/${workoutId}`);

  return { success: true, selfieId: response.data?.selfie_id };
}

export async function getWorkoutSelfies(workoutId: string) {
  const response = await apiGet<SelfieResponse>(
    `/api/workouts/${workoutId}/selfie`
  );
  if (!response.success) {
    return { selfies: [], error: response.error || "Failed to load selfies" };
  }
  return { selfies: response.data?.selfies || [], error: null };
}

export async function deleteWorkoutSelfie(selfieId: string) {
  const response = await apiDelete<SelfieResponse>(`/api/selfies/${selfieId}`);

  if (!response.success) {
    return { error: response.error || "Failed to delete selfie" };
  }

  revalidatePath("/workouts");
  return { success: true };
}

export async function updateSelfieCaption(selfieId: string, caption: string) {
  const response = await apiPut<SelfieResponse>(
    `/api/selfies/${selfieId}/caption`,
    { caption }
  );

  if (!response.success) {
    return { error: response.error || "Failed to update caption" };
  }

  revalidatePath("/workouts");
  return { success: true };
}

export async function getRecentSelfies(limit: number = 10) {
  const response = await apiGet<SelfieResponse>(
    `/api/selfies/recent?limit=${limit}`
  );
  return { selfies: response.data?.selfies || [] };
}

export async function getSelfieUrl(filePath: string) {
  interface UrlResponse {
    url?: string;
  }
  const response = await apiGet<UrlResponse>(
    `/api/selfies/url?path=${encodeURIComponent(filePath)}`
  );
  return { url: response.data?.url || "" };
}
