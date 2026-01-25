import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/workouts/[id] - Get a specific workout
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBackend(request, `/api/workouts/${id}`);
}

// PUT /api/workouts/[id] - Update a workout
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBackend(request, `/api/workouts/${id}`);
}

// DELETE /api/workouts/[id] - Delete a workout
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBackend(request, `/api/workouts/${id}`);
}
