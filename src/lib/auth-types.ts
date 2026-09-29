export type AccountType = "user" | "merchant" | "admin";

export const VALID_ACCOUNT_TYPES: readonly AccountType[] = ["user", "merchant", "admin"];

/**
 * The only roles a person may pick for themselves. `admin` is deliberately
 * excluded: it grants a 10-ad quota, the moderation UI and a cross-owner
 * delete branch, so it must only ever be assigned server-side (see the
 * `guard_profile_server_columns` trigger in supabase/schema.sql).
 */
export const SELF_SERVICE_ACCOUNT_TYPES: readonly AccountType[] = ["user", "merchant"];

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: AccountType;
  lang: "fr" | "ar";
  createdAt: string;
}

export function isAccountType(value: unknown): value is AccountType {
  return typeof value === "string" && (VALID_ACCOUNT_TYPES as readonly string[]).includes(value);
}