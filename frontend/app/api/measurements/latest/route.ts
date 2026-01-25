import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

// GET /api/measurements/latest - Get latest measurement
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/measurements/latest");
}
