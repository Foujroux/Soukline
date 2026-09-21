import type { User } from "@supabase/supabase-js";
import type { AccountType, SessionUser } from "@/lib/auth-types";
import { createReadClient } from "@/utils/supabase/server";
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
 * it to the SessionUser shape used across the app. Session refresh is handled
 * by the middleware, so this helper is read-only.
 */
export async function getUserFromRequest(
  request: Request
): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createReadClient(request);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return userToSessionUser(data.user);
}