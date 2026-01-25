import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

// GET /api/selfies/recent - Get recent selfies
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "10";
  return proxyToBackend(request, `/api/selfies/recent?limit=${limit}`);
}
