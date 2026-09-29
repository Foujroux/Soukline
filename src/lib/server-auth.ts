import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AccountType, SessionUser } from "@/lib/auth-types";
import {
  createSupabaseContext,
  type AppContext,
} from "@/utils/supabase/context";
import { isSupabaseConfigured } from "@/utils/supabase/config";

const VALID: readonly AccountType[] = ["user", "merchant", "admin"];

function toAccountType(value: unknown): AccountType {
  const v = String(value ?? "user");
  return (VALID as readonly string[]).includes(v) ? (v as AccountType) : "user";
}

/**
 * Resolves the account role from the user's own `profiles` row, which is
 * server-assigned.
 *
 * This deliberately does NOT read `user.user_metadata.account_type`. GoTrue
 * lets the account holder rewrite `user_metadata` at any time with
 * `PUT /auth/v1/user` and their own JWT, so a role sourced from there could be
 * escalated to `admin` after signup -- which unlocked a 10-ad quota, the
 * moderation UI and the cross-owner delete branch in `deleteAd`.
 *
 * A failed read falls back to "user", the least-privileged role, so an outage
 * downgrades privileges rather than granting them.
 */
async function resolveAccountType(
  supabase: SupabaseClient,
  userId: string
): Promise<AccountType> {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return "user";
  return toAccountType(data.account_type);
}

export function userToSessionUser(
  user: User,
  accountType: AccountType = "user"
): SessionUser {
  const meta = user.user_metadata ?? {};
  const name =
    String(meta.full_name ?? meta.name ?? "") ||
    user.email?.split("@")[0] ||
    "";
  return {
    id: user.id,
    name,
    email: user.email ?? "",
    phone: String(meta.phone ?? user.phone ?? ""),
    accountType,
    lang: meta.lang === "ar" ? "ar" : "fr",
    createdAt: user.created_at,
  };
}

/**
 * Builds a SessionUser whose role comes from the server-assigned profile row.
 * Use this instead of `userToSessionUser` wherever a Supabase client is
 * available, so the returned role is not client-asserted.
 */
export async function getSessionUser(
  supabase: SupabaseClient,
  user: User
): Promise<SessionUser> {
  return userToSessionUser(user, await resolveAccountType(supabase, user.id));
}

/**
 * Resolves the authenticated Supabase user from the request cookies and maps
 * it to the SessionUser shape used across the app. The access token cookie is
 * first verified against the project JWKS (verifyCredentials); the full User
 * object is then fetched via getUser() on the RLS-scoped context client.
 */
export interface AuthContext extends AppContext {
  user: SessionUser;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  if (!isSupabaseConfigured()) return null;
  const { data: ctx, error } = await createSupabaseContext({ auth: "user" });
  if (error || !ctx || !ctx.userClaims) return null;
  const { data, error: userError } = await ctx.supabase.auth.getUser();
  if (userError || !data.user) return null;
  return { ...ctx, user: await getSessionUser(ctx.supabase, data.user) };
}

/**
 * Resolves the authenticated session user from the incoming request cookies,
 * or null when there is no valid session.
 */
export async function getUserFromRequest(): Promise<SessionUser | null> {
  const ctx = await getAuthContext();
  return ctx?.user ?? null;
}