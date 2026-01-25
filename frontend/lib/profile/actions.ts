"use server";

import { revalidatePath } from "next/cache";
import { apiGet, apiPut } from "@/lib/api/client";
import type { Profile } from "@/types";

export interface ProfileData {
  full_name?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  height_cm?: number;
  fitness_level?: "beginner" | "intermediate" | "advanced";
  fitness_goals?: string[];
  medical_conditions?: string;
  injuries?: string;
  theme?: string;
  accent_theme?: string;
  weight_unit?: string;
  distance_unit?: string;
  notification_preferences?: Record<string, unknown>;
}

interface ProfileResponse {
  success: boolean;
  profile?: Profile;
  error?: string;
}

export async function getProfile(): Promise<{ profile?: Profile; error?: string }> {
  const response = await apiGet<ProfileResponse>("/api/profile");

  if (!response.success) {
    return { error: response.error || "Failed to fetch profile" };
  }

  return { profile: response.data?.profile };
}

export async function updateProfile(profileData: ProfileData) {
  const response = await apiPut<ProfileResponse>("/api/profile", profileData);

  if (!response.success) {
    return { error: response.error || "Failed to update profile" };
  }

  revalidatePath("/profile");
  return { success: true };
}
