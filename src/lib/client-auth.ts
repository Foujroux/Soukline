import type { SessionUser } from "@/lib/auth-types";

const AUTH_EVENT = "soukdz:auth";

let cached: SessionUser | null | undefined = undefined;

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }
}

export function getCachedUser(): SessionUser | null {
  return cached ?? null;
}

export async function getProfile(): Promise<SessionUser | null> {
  if (cached !== undefined) return cached;
  return refreshSession();
}

async function refreshSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    const data = res.ok ? ((await res.json()) as { user: SessionUser | null }) : null;
    cached = data?.user ?? null;
  } catch {
    cached = null;
  }
  notify();
  return cached;
}

export async function login(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json().catch(() => null)) as { user?: SessionUser; error?: string } | null;
    if (res.ok && data?.user) {
      cached = data.user;
      notify();
      return { ok: true };
    }
    return { ok: false, error: data?.error ?? "INVALID_CREDENTIALS" };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

export async function register(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  accountType: "user" | "merchant" | "admin";
  lang: "fr" | "ar";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => null)) as { user?: SessionUser; error?: string } | null;
    if (res.ok && data?.user) {
      cached = data.user;
      notify();
      return { ok: true };
    }
    return { ok: false, error: data?.error ?? "BAD_REQUEST" };
  } catch {
    return { ok: false, error: "NETWORK" };
  }
}

export async function clearProfile(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  } catch {
    // ignore network errors on logout
  }
  cached = null;
  notify();
}

export function accountTypeLabel(type: SessionUser["accountType"], lang: "fr" | "ar"): string {
  if (lang === "ar") {
    return type === "admin" ? "مشرف" : type === "merchant" ? "تاجر" : "مستخدم";
  }
  return type === "admin" ? "Admin" : type === "merchant" ? "Marchand" : "Utilisateur";
}