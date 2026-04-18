import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "A scan id is required.",
        },
      },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_CONFIGURED",
          message:
            "Saved scans are not configured. Run an analysis from the home page without Supabase, or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        },
      },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("scans")
    .select("url, issues")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Supabase scan fetch:", error.message);
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: "Could not load this scan.",
        },
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "No scan found for this link.",
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    url: data.url as string,
    issues: data.issues,
  });
}
