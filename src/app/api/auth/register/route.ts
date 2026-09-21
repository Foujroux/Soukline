import { NextRequest, NextResponse } from "next/server";
import { sanitizeEmail, sanitizeName, sanitizePhone } from "@/lib/sanitize";
import { VALID_ACCOUNT_TYPES, type AccountType } from "@/lib/auth-types";
import { userToSessionUser } from "@/lib/server-auth";
import {
  createRouteClient,
  isSupabaseConfigured,
} from "@/utils/supabase/server";

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

export async function POST(request: NextRequest) {
  const body = await parseJson(request);
  if (!body) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    console.error(
      "[auth] registration blocked: NEXT_PUBLIC_SUPABASE_URL / ANON (or PUBLISHABLE) key missing"
    );
    return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 500 });
  }

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

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone, account_type: accountType, lang },
      },
    });

    if (error) {
      if (
        /already registered|already been registered|user_already_exists|email.*exist/i.test(
          error.message
        )
      ) {
        return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
      }
      console.error("[auth] signUp error:", error.message);
      return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
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
        if (/email.*not.*confirmed/i.test(signIn.error.message)) {
          // The account lives in Supabase Auth and the on_auth_user_created
          // trigger creates the profile row. Ask the user to confirm email.
          return NextResponse.json(
            { error: "EMAIL_NOT_CONFIRMED" },
            { status: 400 }
          );
        }
        console.warn("[auth] auto sign-in after signUp failed:", signIn.error.message);
        return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
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
      console.warn("[auth] profile sync failed:", syncError);
    }

    return copySessionCookies(
      cookieJar,
      NextResponse.json({ user: userToSessionUser(data.user) })
    );
  } catch (error) {
    console.error("register error:", error);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}