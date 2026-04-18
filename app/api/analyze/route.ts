import {
  analyzePage,
  isAnalyzerError,
  type AnalyzerErrorCode,
} from "@/lib/analyzer";
import { normalizePreset } from "@/lib/axe-presets";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const STATUS_BY_CODE: Record<AnalyzerErrorCode, number> = {
  INVALID_URL: 400,
  TIMEOUT: 504,
  NAVIGATION_FAILED: 502,
  ANALYSIS_FAILED: 500,
  BROWSER_UNAVAILABLE: 500,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 }
    );
  }

  const url =
    typeof body === "object" &&
    body !== null &&
    "url" in body &&
    typeof (body as { url: unknown }).url === "string"
      ? (body as { url: string }).url
      : undefined;

  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "A URL is required.",
        },
      },
      { status: 400 }
    );
  }

  const rawPreset =
    typeof body === "object" &&
    body !== null &&
    "preset" in body
      ? (body as { preset: unknown }).preset
      : undefined;
  if (
    rawPreset !== undefined &&
    rawPreset !== "default" &&
    rawPreset !== "extended"
  ) {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: 'preset은 "default" 또는 "extended"만 허용됩니다.',
        },
      },
      { status: 400 }
    );
  }

  const rl = checkRateLimit(clientKeyFromRequest(request));
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: `Too many requests. Try again in ${rl.retryAfterSec} seconds.`,
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  try {
    const preset = normalizePreset(rawPreset);
    const { issues, cached, canonicalUrl, preset: usedPreset } =
      await analyzePage(url, { preset });

    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("scans")
        .insert({ url: canonicalUrl, issues })
        .select("id")
        .single();

      if (!error && data?.id) {
        return NextResponse.json({
          scanId: data.id,
          issues,
          cached,
          preset: usedPreset,
        });
      }
      if (error) {
        console.error("Supabase insert failed:", error.message);
      }
    }

    return NextResponse.json({ issues, cached, preset: usedPreset });
  } catch (e: unknown) {
    if (isAnalyzerError(e)) {
      if (e.cause) {
        console.error("AnalyzerError:", e.code, e.cause);
      }
      return NextResponse.json(
        { error: { code: e.code, message: e.message } },
        { status: STATUS_BY_CODE[e.code] }
      );
    }
    console.error(e);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
