import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/goals/[id] - Get a specific goal
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBackend(request, `/api/goals/${id}`);
}

// PUT /api/goals/[id] - Update a goal
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBackend(request, `/api/goals/${id}`);
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBackend(request, `/api/goals/${id}`);
}
