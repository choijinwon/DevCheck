import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight health check for uptime monitors (no Puppeteer).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "frontend-qa-checker",
    timestamp: new Date().toISOString(),
  });
}
