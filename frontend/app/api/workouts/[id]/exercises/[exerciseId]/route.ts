import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

type RouteParams = { params: Promise<{ id: string; exerciseId: string }> };

// DELETE /api/workouts/[id]/exercises/[exerciseId] - Delete an exercise
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id, exerciseId } = await params;
  return proxyToBackend(request, `/api/workouts/${id}/exercises/${exerciseId}`);
}
