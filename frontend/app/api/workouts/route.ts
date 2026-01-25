import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

// GET /api/workouts - List all workouts
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/workouts");
}

// POST /api/workouts - Create a new workout
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/workouts");
}
