import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/profile");
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  return proxyToBackend(request, "/api/profile");
}
