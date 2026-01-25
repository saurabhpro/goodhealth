import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/proxy";

// GET /api/selfies/url - Get signed URL for a selfie
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) {
    return new Response(JSON.stringify({ error: "Missing path parameter" }), {
      status: 400,
    });
  }
  return proxyToBackend(
    request,
    `/api/selfies/url?path=${encodeURIComponent(path)}`
  );
}
