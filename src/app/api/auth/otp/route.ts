import { NextRequest, NextResponse } from "next/server";
import { toAlgeriaE164 } from "@/lib/phone";
import { createRouteClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { validateSupabaseConfig } from "@/utils/supabase/config";
import { rootErrorMessage, serializeError } from "@/lib/supabase-diag";

export const runtime = "nodejs";

type Classified = { code: string; status: number };

/**
 * Maps GoTrue's phone-auth failures onto codes the auth screens can translate.
 * The raw message is always logged separately.
 */
function classifyOtpError(error: { message?: string; status?: number }): Classified {
  const msg = (error?.message ?? "").toLowerCase();

  if (
    /rate limit|too many requests|over_request_rate_limit|too frequent|security purposes/i.test(
      msg
    )
  ) {
    return { code: "RATE_LIMITED", status: 429 };
  }
  if (/phone.*not.*allowed|phone_not_allowed|not allowed|blocked|blacklist/i.test(msg)) {
    return { code: "PHONE_NOT_ALLOWED", status: 403 };
  }
  if (/signups? not allowed|signup.*disabled|not allowed to sign ?up/i.test(msg)) {
    return { code: "SIGNUPS_DISABLED", status: 403 };
  }
  if (/sms.*disabled|phone.*disabled|phone provider|not configured|unsupported.*provider/i.test(msg)) {
    return { code: "SMS_UNAVAILABLE", status: 503 };
  }
  if (/invalid phone|invalid format|phone.*invalid|unable to parse/i.test(msg)) {
    return { code: "PHONE_INVALID", status: 400 };
  }
  return { code: "OTP_SEND_FAILED", status: 500 };
}

/**
 * Step 1 of phone sign-in: send a one-time code by SMS.
 *
 * The number is normalized to E.164 for Algeria first, because GoTrue rejects
 * anything else. This route never establishes a session - that happens in
 * /api/auth/otp/verify.
 */
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

  const phone = toAlgeriaE164(body.phone);
  if (!phone) {
    return NextResponse.json({ error: "PHONE_INVALID" }, { status: 400 });
  }

  const validation = validateSupabaseConfig();
  if (!validation.ok || !isSupabaseConfigured()) {
    console.error(
      "[auth] otp send blocked: invalid Supabase configuration",
      validation.fatalIssues
    );
    return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 500 });
  }

  const cookieJar = NextResponse.json({});
  const supabase = createRouteClient(request, cookieJar);

  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        // Social sign-in creates the account on first use, so phone does too.
        shouldCreateUser: true,
      },
    });

    if (error) {
      const classified = classifyOtpError(error);
      console.error("[auth] otp signInWithOtp failed", {
        phone,
        status: classified.status,
        message: error.message,
        rawStatus: error.status ?? null,
        cause: serializeError(0, (error as { cause?: unknown }).cause),
      });
      return NextResponse.json({ error: classified.code }, { status: classified.status });
    }

    // No session yet: signInWithOtp only dispatched the code. The response
    // still carries any pre-existing session cookies GoTrue refreshed, so copy
    // them across to keep an already-signed-in visitor signed in.
    const response = NextResponse.json({ ok: true, phone });
    for (const cookie of cookieJar.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  } catch (error) {
    console.error("[auth] otp send unexpected error:", {
      phone,
      message: rootErrorMessage(error),
      error: serializeError(0, error),
    });
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
