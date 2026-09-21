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

let inflight: Promise<SessionUser | null> | null = null;

async function refreshSession(): Promise<SessionUser | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    let next: SessionUser | null = null;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
        cache: "no-store",
      });

      if (res.status === 401) {
        // The me endpoint returns 401 when there is no valid session. This is
        // the expected "logged out" signal, not an error.
        next = null;
      } else if (res.ok) {
        const data = (await res
          .json()
          .catch(() => null)) as { user?: SessionUser | null } | null;
        next = data?.user ?? null;
      } else {
        // Unexpected status (e.g. 5xx) — keep the last known session state
        // instead of flashing authenticated users to a logged-out UI.
        return cached ?? null;
      }
    } catch {
      // Network failure — keep the last known state, do not log out.
      return cached ?? null;
    }

    if (next !== cached) {
      cached = next;
      notify();
    }
    return cached;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    console.debug("[client] POST /api/auth/login", { email });
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
    // The edge rate-limiter returns 429 with a human-readable message, not a
    // machine-readable code — normalize it so the UI can translate it.
    if (res.status === 429) {
      return { ok: false, error: "RATE_LIMITED" };
    }
    return { ok: false, error: data?.error ?? "INVALID_CREDENTIALS" };
  } catch (err) {
    console.error("[client] login fetch failed:", err);
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
    console.debug("[client] POST /api/auth/register", { email: input.email });
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
    // The edge rate-limiter returns 429 with a human-readable message, not a
    // machine-readable code — normalize it so the UI can translate it.
    if (res.status === 429) {
      return { ok: false, error: "RATE_LIMITED" };
    }
    return { ok: false, error: data?.error ?? "BAD_REQUEST" };
  } catch (err) {
    console.error("[client] register fetch failed:", err);
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