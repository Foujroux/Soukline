import { NextRequest, NextResponse } from "next/server";
import { userToSessionUser } from "@/lib/server-auth";
import {
  createRouteClient,
  isSupabaseConfigured,
} from "@/utils/supabase/server";
import { rootErrorMessage, serializeError } from "@/lib/supabase-diag";
import { validateSupabaseConfig } from "@/utils/supabase/config";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  // Explicit pre-flight check: validate the Supabase URL/keys BEFORE any auth
  // call so a misconfigured deployment surfaces in Vercel logs as the real
  // cause (e.g. AuthRetryableFetchError "fetch failed") instead of a masked
  // generic error.
  const validation = validateSupabaseConfig();
  if (!validation.ok || !isSupabaseConfigured()) {
    console.error(
      "[auth] login blocked: invalid Supabase configuration",
      validation.fatalIssues
    );
    return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 500 });
  }

  const cookieJar = NextResponse.json({});
  const supabase = createRouteClient(request, cookieJar);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      // Log the exact Supabase message, HTTP status, and raw network cause so
      // Vercel logs reveal whether the failure is DNS, TLS, timeout, or an
      // actual invalid-credentials 401.
      const anyError = error as
        | { name?: string; status?: number; code?: string; cause?: unknown; stack?: string }
        | undefined;
      const errorName = anyError?.name ?? "AuthError";
      const isFetchFailure =
        errorName === "AuthRetryableFetchError" ||
        /fetch failed|failed to fetch|network|ENOTFOUND|UND_ERR|ECONNRESET|ETIMEDOUT/i.test(
          error?.message ?? ""
        );
      console.error("[auth] login signIn failed", {
        email,
        errorName,
        rawStatus: anyError?.status ?? null,
        message: error?.message ?? "no user",
        code: anyError?.code ?? null,
        cause: serializeError(0, anyError?.cause),
        stack: anyError?.stack ?? null,
      });

      if (error?.message && /email.*not.*confirmed/i.test(error.message)) {
        return NextResponse.json(
          { error: "EMAIL_NOT_CONFIRMED" },
          { status: 400 }
        );
      }

      if (isFetchFailure) {
        console.error("[auth] login signIn network-layer error:", {
          email,
          error: rootErrorMessage(error),
          cause: serializeError(0, anyError?.cause),
        });
      }

      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const response = NextResponse.json({ user: userToSessionUser(data.user) });
    return copySessionCookies(cookieJar, response);
  } catch (error) {
    const message = rootErrorMessage(error);
    console.error("[auth] login unexpected error:", {
      email,
      message,
      error: serializeError(0, error),
    });
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

function copySessionCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}