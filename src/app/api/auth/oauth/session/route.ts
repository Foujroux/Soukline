import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { isAdoptableIdentity, syncAdoptedProfile } from "@/lib/sync-profile";
import {
  createRouteClient,
  isSupabaseConfigured,
} from "@/utils/supabase/server";
import { validateSupabaseConfig } from "@/utils/supabase/config";
import { rootErrorMessage, serializeError } from "@/lib/supabase-diag";

export const runtime = "nodejs";

/**
 * Adopts a session produced by the OAuth PKCE handshake into this app's
 * httpOnly cookie session.
 *
 * The callback page already holds a real access/refresh token pair from
 * `exchangeCodeForSession`; this route exists so those tokens are written by
 * the server into the same cookies the email/password flow uses. Everything
 * downstream (`getUserFromRequest`, proxy refresh) then works identically
 * regardless of how the user signed in.
 *
 * The provider check is not decoration: without it this endpoint would accept
 * any valid token pair, including a password session, and act as a generic
 * "import any session" primitive.
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

  const accessToken = String(body.access_token ?? "");
  const refreshToken = String(body.refresh_token ?? "");
  const lang = body.lang === "ar" ? "ar" : "fr";

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const validation = validateSupabaseConfig();
  if (!validation.ok || !isSupabaseConfigured()) {
    console.error(
      "[auth] oauth session blocked: invalid Supabase configuration",
      validation.fatalIssues
    );
    return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 500 });
  }

  const cookieJar = NextResponse.json({});
  const supabase = createRouteClient(request, cookieJar);

  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !data.user) {
      console.error("[auth] oauth setSession failed", {
        message: error?.message ?? "no user returned",
        status: (error as { status?: number } | undefined)?.status ?? null,
        cause: serializeError(0, (error as { cause?: unknown } | undefined)?.cause),
      });
      return NextResponse.json({ error: "OAUTH_SESSION_INVALID" }, { status: 401 });
    }

    const user = data.user;

    if (!isAdoptableIdentity(user)) {
      console.warn(
        "[auth] oauth session rejected: identity is not a social/phone provider",
        { providers: (user.identities ?? []).map((i) => i?.provider) }
      );
      return NextResponse.json({ error: "PROVIDER_NOT_ALLOWED" }, { status: 403 });
    }

    await syncAdoptedProfile(supabase, user, lang);

    const response = NextResponse.json({ user: await getSessionUser(supabase, user) });
    for (const cookie of cookieJar.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  } catch (error) {
    console.error("[auth] oauth session unexpected error:", {
      message: rootErrorMessage(error),
      error: serializeError(0, error),
    });
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
