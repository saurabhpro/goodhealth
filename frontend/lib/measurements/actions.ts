"use server";

import { revalidatePath } from "next/cache";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { Database } from "@/types/database";

type Measurement = Database["public"]["Tables"]["body_measurements"]["Row"];

interface MeasurementResponse {
  success: boolean;
  data?: Measurement;
  measurement?: Measurement;
  measurements?: Measurement[];
  error?: string;
}

const FLOAT_FIELDS = [
  "weight",
  "body_fat_percentage",
  "muscle_mass",
  "bone_mass",
  "water_percentage",
  "height",
  "neck",
  "shoulders",
  "chest",
  "waist",
  "hips",
  "bicep_left",
  "bicep_right",
  "forearm_left",
  "forearm_right",
  "thigh_left",
  "thigh_right",
  "calf_left",
  "calf_right",
  "protein_percentage",
];

const INT_FIELDS = ["bmr", "metabolic_age", "visceral_fat"];

function parseMeasurementData(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {
    measured_at:
      (formData.get("measured_at") as string) || new Date().toISOString(),
  };

  for (const field of FLOAT_FIELDS) {
    const value = formData.get(field);
    if (value) {
      data[field] = Number.parseFloat(value as string);
    }
  }

  for (const field of INT_FIELDS) {
    const value = formData.get(field);
    if (value) {
      data[field] = Number.parseInt(value as string);
    }
  }

  const notes = formData.get("notes");
  if (notes) {
    data.notes = notes;
  }

  return data;
}

export async function createMeasurement(formData: FormData) {
  const data = parseMeasurementData(formData);
  const response = await apiPost<MeasurementResponse>("/api/measurements", data);

  if (!response.success) {
    return { error: response.error || "Failed to create measurement" };
  }

  revalidatePath("/measurements");
  revalidatePath("/progress");
  revalidatePath("/profile");
  revalidatePath("/goals");

  return { success: true, data: response.data };
}

export async function getMeasurements(limit?: number): Promise<{ measurements: Measurement[] }> {
  const path = limit ? `/api/measurements?limit=${limit}` : "/api/measurements";
  const response = await apiGet<MeasurementResponse>(path);
  return { measurements: response.data?.measurements || [] };
}

export async function getLatestMeasurement(): Promise<{ measurement: Measurement | null }> {
  const response = await apiGet<MeasurementResponse>("/api/measurements/latest");
  return { measurement: response.data?.measurement || null };
}

export async function updateMeasurement(
  measurementId: string,
  formData: FormData
) {
  const data = parseMeasurementData(formData);
  const response = await apiPut<MeasurementResponse>(
    `/api/measurements/${measurementId}`,
    data
  );

  if (!response.success) {
    return { error: response.error || "Failed to update measurement" };
  }

  revalidatePath("/measurements");
  revalidatePath("/progress");
  revalidatePath("/profile");

  return { success: true };
}

export async function deleteMeasurement(measurementId: string) {
  const response = await apiDelete<MeasurementResponse>(
    `/api/measurements/${measurementId}`
  );

  if (!response.success) {
    return { error: response.error || "Failed to delete measurement" };
  }

  revalidatePath("/measurements");
  revalidatePath("/progress");
  revalidatePath("/profile");

  return { success: true };
}
