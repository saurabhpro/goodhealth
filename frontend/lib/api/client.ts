"use server";

/**
 * API client for making authenticated requests to the Python backend.
 * Forwards the Supabase JWT token for authentication.
 */

import { createClient } from "@/lib/supabase/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL!;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Make an authenticated API request to the Python backend.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${PYTHON_API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || "Request failed" };
    }

    return { success: true, data: data as T };
  } catch (error) {
    console.error(`API request failed: ${path}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export async function apiGet<T = unknown>(path: string) {
  return apiRequest<T>(path, { method: "GET" });
}

export async function apiPost<T = unknown>(path: string, body?: unknown) {
  return apiRequest<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T = unknown>(path: string, body?: unknown) {
  return apiRequest<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T = unknown>(path: string) {
  return apiRequest<T>(path, { method: "DELETE" });
}

/**
 * Upload a file to the Python backend.
 */
export async function apiUpload<T = unknown>(
  path: string,
  file: File,
  additionalFields?: Record<string, string>
): Promise<ApiResponse<T>> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { success: false, error: "Not authenticated" };
    }

    const formData = new FormData();
    formData.append("file", file);

    if (additionalFields) {
      for (const [key, value] of Object.entries(additionalFields)) {
        formData.append(key, value);
      }
    }

    const response = await fetch(`${PYTHON_API_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.detail || "Upload failed" };
    }

    return { success: true, data: data as T };
  } catch (error) {
    console.error(`API upload failed: ${path}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
