import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

// GET /api/measurements - List all measurements
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");
  const path = limit ? `/api/measurements?limit=${limit}` : "/api/measurements";
  return proxyToBackend(request, path);
}

// POST /api/measurements - Create a new measurement
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/measurements");
}
