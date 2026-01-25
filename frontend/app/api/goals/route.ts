import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

// GET /api/goals - List all goals
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/goals");
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/goals");
}
