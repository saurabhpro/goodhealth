import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/workouts/[id]/selfie - Get selfie for a workout
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBackend(request, `/api/workouts/${id}/selfie`);
}
