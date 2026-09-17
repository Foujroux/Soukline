export type AccountType = "user" | "merchant" | "admin";

export const VALID_ACCOUNT_TYPES: readonly AccountType[] = ["user", "merchant", "admin"];

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