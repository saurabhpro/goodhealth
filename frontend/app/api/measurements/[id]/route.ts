import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/measurements/[id] - Get a specific measurement
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBackend(request, `/api/measurements/${id}`);
}

// PUT /api/measurements/[id] - Update a measurement
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBackend(request, `/api/measurements/${id}`);
}

// DELETE /api/measurements/[id] - Delete a measurement
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyToBackend(request, `/api/measurements/${id}`);
}
