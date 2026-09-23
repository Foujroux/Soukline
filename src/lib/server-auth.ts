import type { User } from "@supabase/supabase-js";
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

export function userToSessionUser(user: User): SessionUser {
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
    accountType: toAccountType(meta.account_type),
    lang: meta.lang === "ar" ? "ar" : "fr",
    createdAt: user.created_at,
  };
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
  return { ...ctx, user: userToSessionUser(data.user) };
}

/**
 * Resolves the authenticated session user from the incoming request cookies,
 * or null when there is no valid session.
 */
export async function getUserFromRequest(): Promise<SessionUser | null> {
  const ctx = await getAuthContext();
  return ctx?.user ?? null;
}