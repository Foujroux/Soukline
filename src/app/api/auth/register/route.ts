import { NextRequest, NextResponse } from "next/server";
import { sanitizeEmail, sanitizeName, sanitizePhone } from "@/lib/sanitize";
import { VALID_ACCOUNT_TYPES, type AccountType } from "@/lib/auth-types";
import { userToSessionUser } from "@/lib/server-auth";
import {
  createRouteClient,
  isSupabaseConfigured,
} from "@/utils/supabase/server";
import {
  logEnvPresence,
  probeAuthHealth,
  rootErrorMessage,
  serializeError,
} from "@/lib/supabase-diag";
import {
  logSupabaseConfig,
  supabaseUrl,
  validateSupabaseConfig,
} from "@/utils/supabase/config";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function parseJson(request: NextRequest): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return Promise.resolve(null);
  return request.json().catch(() => null);
}

function copySessionCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

type ErrorClassification = { code: string; status: number };

// Maps raw Supabase Auth errors to a machine-readable code so the frontend can
// show a specific message instead of a generic fallback. The raw error message
// is always logged separately for Vercel log debugging.
function classifySignUpError(error: {
  message?: string;
  status?: number;
}): ErrorClassification {
  const msg = (error?.message ?? "").toLowerCase();

  if (
    /already registered|already been registered|user_already_exists|already in use|email.*exist/i.test(
      msg
    )
  ) {
    return { code: "EMAIL_EXISTS", status: 409 };
  }

  if (
    error?.status === 429 ||
    /rate limit|too many requests|over_email_send_rate_limit|over_request_rate_limit|too frequent|temp_blocked/i.test(
      msg
    )
  ) {
    return { code: "RATE_LIMITED", status: 429 };
  }

  if (
    /signup|sign_up|registration/i.test(msg) &&
    /disabled/i.test(msg)
  ) {
    return { code: "SIGNUPS_DISABLED", status: 403 };
  }

  if (/invalid email|invalid_email|unable to validate.*email/i.test(msg)) {
    return { code: "INVALID_EMAIL", status: 400 };
  }

  if (/not allowed|blocked|blacklist|forbidden|prohibited/i.test(msg)) {
    return { code: "EMAIL_NOT_ALLOWED", status: 403 };
  }

  return { code: "INTERNAL", status: 500 };
}

function classifyAutoLoginError(error: {
  message?: string;
  status?: number;
}): ErrorClassification {
  const msg = (error?.message ?? "").toLowerCase();

  if (/email.*not.*confirmed|unconfirmed/i.test(msg)) {
    return { code: "EMAIL_NOT_CONFIRMED", status: 400 };
  }

  if (
    error?.status === 429 ||
    /rate limit|too many requests|over_request_rate_limit|too frequent/i.test(msg)
  ) {
    return { code: "RATE_LIMITED", status: 429 };
  }

  if (
    /invalid.*credentials|invalid login|no user found|not found|user not found|unable to.*user/i.test(
      msg
    )
  ) {
    return { code: "INVALID_CREDENTIALS", status: 401 };
  }

  return { code: "INTERNAL", status: 500 };
}

export async function POST(request: NextRequest) {
  const body = await parseJson(request);
  if (!body) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  // Explicit pre-flight check: validate the Supabase URL/keys BEFORE any auth
  // call so a misconfigured deployment surfaces in Vercel logs as the real
  // cause (e.g. AuthRetryableFetchError "fetch failed") instead of a masked
  // generic error.
  const validation = validateSupabaseConfig();
  if (!validation.ok || !isSupabaseConfigured()) {
    logSupabaseConfig("register");
    console.error(
      "[auth] registration blocked: invalid Supabase configuration",
      validation.fatalIssues
    );
    return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 500 });
  }
  if (validation.issues.length > 0) {
    // Cosmetic issues (quotes / whitespace) are auto-sanitized by config, but
    // still surface them so the deployment env vars can be cleaned up.
    logSupabaseConfig("register");
  }

  // ── Diagnostic instrumentation (temporary, for the 500 "fetch failed" hunt).
  // Direct raw network + env checks BEFORE any SDK auth call.
  logEnvPresence("register");
  await probeAuthHealth("register", supabaseUrl);

  const name = sanitizeName(String(body.name ?? "").trim());
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = sanitizePhone(String(body.phone ?? "").trim());
  const password = String(body.password ?? "");
  const lang = body.lang === "ar" ? "ar" : "fr";
  const accountTypeRaw = String(body.accountType ?? "user");
  const accountType: AccountType =
    (VALID_ACCOUNT_TYPES as readonly string[]).includes(accountTypeRaw)
      ? (accountTypeRaw as AccountType)
      : "user";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: "INVALID_NAME" }, { status: 400 });
  }
  if (password.length < 6 || password.length > 128) {
    return NextResponse.json({ error: "WEAK_PASSWORD" }, { status: 400 });
  }

  const cookieJar = NextResponse.json({});
  const supabase = createRouteClient(request, cookieJar);

  // Log the exact URL the Supabase SDK will call against, so a wrong/missing
  // scheme or a mistyped hostname is visible in Vercel logs right at the line
  // where "fetch failed" is thrown.
  console.log("Supabase URL Target:", {
    raw: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "undefined",
    effective: supabaseUrl,
    hasHttpsPrefix: supabaseUrl.startsWith("https://"),
  });

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone, account_type: accountType, lang },
      },
    });

    if (error) {
      // Log the exact Supabase message + HTTP status so Vercel logs surface the
      // real cause (rate limit, rejected email, disabled signups, DNS, TLS, ...).
      const classified = classifySignUpError(error);
      const anyError = error as {
        name?: string;
        status?: number;
        code?: string;
        cause?: unknown;
        stack?: string;
      };
      const errorName = anyError.name ?? "AuthError";
      const isFetchFailure =
        errorName === "AuthRetryableFetchError" ||
        /fetch failed|failed to fetch|network|ENOTFOUND|UND_ERR|ECONNRESET|ETIMEDOUT/i.test(
          error.message ?? ""
        );
      console.error("[auth] register signUp failed", {
        email,
        errorName,
        rawStatus: anyError.status ?? null,
        status: classified.status,
        message: error.message,
        code: anyError.code ?? null,
        cause: serializeError(0, anyError.cause),
        stack: anyError.stack ?? null,
      });
      if (isFetchFailure) {
        // Diagnostic: temporarily return the raw network error to the frontend
        // so the modal shows the actual system failure instead of a generic
        // "Une erreur est survenue".
        return NextResponse.json(
          { error: rootErrorMessage(error), cause: serializeError(0, anyError.cause) },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: classified.code },
        { status: classified.status }
      );
    }

    if (!data.user) {
      console.error("[auth] register signUp returned no user", { email });
      return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
    }

    // Supabase does NOT throw when the email is already registered while email
    // confirmation is enabled; it returns the existing account with an EMPTY
    // identities array instead.
    const identities = data.user.identities ?? null;
    if (Array.isArray(identities) && identities.length === 0) {
      console.warn("[auth] register duplicate email detected", { email });
      return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
    }

    // If email confirmation is required, signUp returns no session. Sign the
    // user in directly so they land on their dashboard immediately and so the
    // profile sync below runs with the user's own auth token (RLS checks it).
    if (!data.session) {
      const signIn = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signIn.error) {
        const classified = classifyAutoLoginError(signIn.error);
        console.warn("[auth] register auto sign-in failed", {
          email,
          status: classified.status,
          message: signIn.error.message,
        });
        return NextResponse.json(
          { error: classified.code },
          { status: classified.status }
        );
      }
    }

    // Persist the profile row so user data survives regardless of metadata.
    try {
      const { error: syncError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            email,
            full_name: name,
            phone,
            account_type: accountType,
            lang,
            created_at: data.user.created_at ?? new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      if (syncError) {
        console.warn(
          `[auth] profile sync warning (run supabase/schema.sql): ${syncError.message}`
        );
      }
    } catch (syncError) {
      const message =
        syncError instanceof Error ? syncError.message : String(syncError);
      console.warn("[auth] profile sync failed:", message);
    }

    return copySessionCookies(
      cookieJar,
      NextResponse.json({ user: userToSessionUser(data.user) })
    );
  } catch (error) {
    const message = rootErrorMessage(error);
    console.error("[auth] register unexpected error:", {
      email,
      message,
      error: serializeError(0, error),
    });
    // Diagnostic: expose the raw error to the frontend so the modal displays
    // the actual system error instead of "Une erreur est survenue".
    return NextResponse.json(
      { error: message, cause: serializeError(0, error) },
      { status: 500 }
    );
  }
}