import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

// GET /api/selfies - handled by sub-routes
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/selfies");
}
