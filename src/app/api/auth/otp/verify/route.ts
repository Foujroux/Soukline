import { NextRequest, NextResponse } from "next/server";
import { toAlgeriaE164 } from "@/lib/phone";
import { getSessionUser } from "@/lib/server-auth";
import { syncAdoptedProfile } from "@/lib/sync-profile";
import { createRouteClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { validateSupabaseConfig } from "@/utils/supabase/config";
import { rootErrorMessage, serializeError } from "@/lib/supabase-diag";

export const runtime = "nodejs";

type Classified = { code: string; status: number };

function classifyVerifyError(error: { message?: string; status?: number }): Classified {
  const msg = (error?.message ?? "").toLowerCase();

  if (/token has expired|expired_token/i.test(msg)) {
    return { code: "OTP_EXPIRED", status: 400 };
  }
  if (/invalid.*token|token.*invalid|invalid.*otp|invalid.*verification/i.test(msg)) {
    return { code: "OTP_INVALID", status: 400 };
  }
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
  return { code: "OTP_INVALID", status: 400 };
}

/**
 * Step 2 of phone sign-in: verify the SMS code and establish the session.
 *
 * `verifyOtp` returns a session, and because this uses the route client the
 * session cookies are written straight onto the outgoing response - the same
 * mechanism the email/password login route uses.
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
  const token = String(body.token ?? "").trim();
  const lang = body.lang === "ar" ? "ar" : "fr";

  if (!phone || !/^\d{4,8}$/.test(token)) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const validation = validateSupabaseConfig();
  if (!validation.ok || !isSupabaseConfigured()) {
    console.error(
      "[auth] otp verify blocked: invalid Supabase configuration",
      validation.fatalIssues
    );
    return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 500 });
  }

  const cookieJar = NextResponse.json({});
  const supabase = createRouteClient(request, cookieJar);

  try {
    // "sms" covers both cases: a returning user signing in and a brand-new
    // phone-only account created by signInWithOtp.
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error || !data.user) {
      const classified = classifyVerifyError(error ?? { message: "no user" });
      console.warn("[auth] otp verify failed", {
        phone,
        status: classified.status,
        message: error?.message ?? "no user",
      });
      return NextResponse.json({ error: classified.code }, { status: classified.status });
    }

    const user = data.user;
    await syncAdoptedProfile(supabase, user, lang);

    const response = NextResponse.json({ user: await getSessionUser(supabase, user) });
    for (const cookie of cookieJar.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  } catch (error) {
    console.error("[auth] otp verify unexpected error:", {
      phone,
      message: rootErrorMessage(error),
      error: serializeError(0, error),
    });
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
