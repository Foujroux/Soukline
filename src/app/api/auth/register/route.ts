import { NextRequest, NextResponse } from "next/server";
import {
  AuthError,
  createSession,
  createUser,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/server-auth";
import { sanitizeEmail, sanitizeName, sanitizePhone } from "@/lib/sanitize";
import { VALID_ACCOUNT_TYPES, type AccountType } from "@/lib/auth-types";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function parseJson(request: NextRequest): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return Promise.resolve(null);
  return request.json().catch(() => null);
}

export async function POST(request: NextRequest) {
  const body = await parseJson(request);
  if (!body) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
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

  try {
    const user = await createUser({ name, email, phone, password, accountType, lang });
    const token = createSession(user);
    const response = NextResponse.json({ user });
    response.cookies.set(
      SESSION_COOKIE,
      token,
      sessionCookieOptions()
    );
    return response;
  } catch (error) {
    if (error instanceof AuthError && error.code === "EMAIL_EXISTS") {
      return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
    }
    console.error("register error:", error);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}