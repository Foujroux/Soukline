import { NextResponse } from "next/server";
import { authHeaders, supabaseUrl } from "@/utils/supabase/config";
import { OAUTH_PROVIDERS } from "@/utils/supabase/oauth-client";
import { rootErrorMessage } from "@/lib/supabase-diag";

export const runtime = "nodejs";

export interface AuthMethods {
  google: boolean;
  facebook: boolean;
  sms: boolean;
  /** True when the probe failed and the defaults below are being assumed. */
  assumed: boolean;
}

/**
 * GoTrue's /settings payload. Only the fields this route reads are declared;
 * everything else is ignored.
 *
 * `external` is a flat provider -> boolean map on current GoTrue
 * ("facebook": true). Older builds nested it ("facebook": { enabled: true }),
 * so both shapes are accepted.
 */
interface GoTrueSettings {
  external?: Record<string, boolean | { enabled?: boolean } | undefined>;
  sms_provider?: string | null;
  disable_signup?: boolean;
}

function isEnabled(value: boolean | { enabled?: boolean } | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object") return value.enabled === true;
  return false;
}

function readBody(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Reports which sign-in methods the Supabase project actually has enabled so
 * the auth screens can hide the ones that would fail.
 *
 * This is a public GoTrue endpoint that only needs the publishable key, so it
 * is safe to read server-side. A network or shape failure falls back to
 * "everything looks available": a visible button that returns a real error is
 * a better failure mode than silently hiding working providers.
 */
export async function GET() {
  if (!supabaseUrl) {
    return NextResponse.json<AuthMethods>(
      { google: false, facebook: false, sms: false, assumed: true },
      { status: 200 }
    );
  }

  const cache = "no-store";
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: authHeaders(),
      cache,
    });
    if (!res.ok) {
      throw new Error(`settings responded ${res.status}`);
    }
    const settings = readBody(await res.text()) as GoTrueSettings | null;
    if (!settings) {
      throw new Error("settings body was not an object");
    }

    const external = settings.external ?? {};
    const methods: AuthMethods = {
      google: isEnabled(external.google),
      facebook: isEnabled(external.facebook),
      // Phone is gated by its own toggle; sms_provider only says which gateway
      // is selected, not that the toggle is on.
      sms: isEnabled(external.phone) && Boolean(settings.sms_provider),
      assumed: false,
    };

    if (settings.disable_signup === true) {
      methods.google = false;
      methods.facebook = false;
      methods.sms = false;
    }

    console.log(
      `[auth] providers available: ${OAUTH_PROVIDERS.filter((p) => methods[p]).join(",") || "none"} sms=${methods.sms}`
    );
    return NextResponse.json(methods, {
      headers: { "Cache-Control": cache },
    });
  } catch (error) {
    console.warn(
      "[auth] provider probe failed, assuming all methods are available:",
      rootErrorMessage(error)
    );
    return NextResponse.json<AuthMethods>(
      { google: true, facebook: true, sms: true, assumed: true },
      { headers: { "Cache-Control": cache } }
    );
  }
}
