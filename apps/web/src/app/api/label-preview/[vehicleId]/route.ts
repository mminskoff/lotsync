import { NextRequest, NextResponse } from "next/server";

const API_BASE = (
  process.env.API_PROXY_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000"
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"))
).replace(/\/$/, "");

type RouteContext = { params: Promise<{ vehicleId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { vehicleId } = await context.params;
  const dealershipId = request.nextUrl.searchParams.get("dealershipId");

  if (!dealershipId) {
    return NextResponse.json({ detail: "dealershipId query param required" }, { status: 400 });
  }

  const url = `${API_BASE}/api/v1/vehicles/${vehicleId}/label-preview`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: { "X-Dealership-Id": dealershipId },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "Cannot reach API — start the backend on port 8000." },
      { status: 502 },
    );
  }

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/png",
      "Cache-Control": "no-store",
    },
  });
}
