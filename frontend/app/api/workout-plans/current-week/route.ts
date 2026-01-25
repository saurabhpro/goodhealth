import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

// GET /api/workout-plans/current-week - Get current week sessions
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/workout-plans/current-week");
}
