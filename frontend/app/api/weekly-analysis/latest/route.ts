import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

// GET /api/weekly-analysis/latest - Get latest weekly analysis
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/weekly-analysis/latest");
}
