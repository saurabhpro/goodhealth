import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/goals/[id]/progress - Update goal progress
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBackend(request, `/api/goals/${id}/progress`);
}
