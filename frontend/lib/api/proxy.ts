/**
 * Server-side utility for API route handlers.
 * Proxies requests to the Python backend with authentication.
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL;

/**
 * Proxy a request to the Python backend with authentication.
 */
export async function proxyToBackend(
  request: NextRequest,
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {}
): Promise<NextResponse> {
  try {
    if (!PYTHON_API_URL) {
      return NextResponse.json(
        { error: "Backend URL not configured" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const fetchOptions: RequestInit = {
      method: options.method || request.method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    } else if (request.method !== "GET" && request.method !== "HEAD") {
      try {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } catch {
        // No body or invalid JSON, that's okay
      }
    }

    const response = await fetch(`${PYTHON_API_URL}${path}`, fetchOptions);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Proxy error for ${path}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy failed" },
      { status: 500 }
    );
  }
}

/**
 * Get auth token for the current session.
 * Returns null if not authenticated.
 */
export async function getAuthToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}
