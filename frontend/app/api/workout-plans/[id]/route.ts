import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PYTHON_API_URL = process.env.PYTHON_API_URL!;

async function getAuthHeaders() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = await getAuthHeaders();
  if (!headers) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const response = await fetch(`${PYTHON_API_URL}/api/workout-plans/${id}`, {
    headers,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = await getAuthHeaders();
  if (!headers) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const response = await fetch(`${PYTHON_API_URL}/api/workout-plans/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = await getAuthHeaders();
  if (!headers) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const response = await fetch(`${PYTHON_API_URL}/api/workout-plans/${id}`, {
    method: "DELETE",
    headers,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
