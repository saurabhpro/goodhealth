"use server";

import { createClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/lib/api/types";

const PYTHON_API_URL = process.env.PYTHON_API_URL;

const REQUEST_FAILED = "Request failed";
const UPLOAD_FAILED = "Upload failed";
const NOT_AUTHENTICATED = "Not authenticated";
const BACKEND_NOT_CONFIGURED = "Backend URL not configured";

async function getValidatedAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return null;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function safeErrorMessage(status: number, fallback: string): string {
  if (status === 401 || status === 403) return NOT_AUTHENTICATED;
  if (status === 404) return "Not found";
  if (status >= 500) return "Server error";
  return fallback;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (!PYTHON_API_URL) {
    return { success: false, error: BACKEND_NOT_CONFIGURED };
  }
  try {
    const accessToken = await getValidatedAccessToken();
    if (!accessToken) {
      return { success: false, error: NOT_AUTHENTICATED };
    }

    const response = await fetch(`${PYTHON_API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: safeErrorMessage(response.status, REQUEST_FAILED),
      };
    }

    return { success: true, data: data as T };
  } catch (error) {
    console.error(`API request failed: ${path}`, error);
    return { success: false, error: REQUEST_FAILED };
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

export async function apiUpload<T = unknown>(
  path: string,
  file: File,
  additionalFields?: Record<string, string>
): Promise<ApiResponse<T>> {
  if (!PYTHON_API_URL) {
    return { success: false, error: BACKEND_NOT_CONFIGURED };
  }
  try {
    const accessToken = await getValidatedAccessToken();
    if (!accessToken) {
      return { success: false, error: NOT_AUTHENTICATED };
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
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: safeErrorMessage(response.status, UPLOAD_FAILED),
      };
    }

    return { success: true, data: data as T };
  } catch (error) {
    console.error(`API upload failed: ${path}`, error);
    return { success: false, error: UPLOAD_FAILED };
  }
}
