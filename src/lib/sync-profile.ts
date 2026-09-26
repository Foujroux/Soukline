import type { SupabaseClient, User } from "@supabase/supabase-js";

// Identity providers this app is willing to turn into a cookie session.
// Password identities are deliberately excluded: the email/password routes
// already own that path, and admitting them here would let any caller adopt an
// arbitrary password-session token through the social endpoint.
const ADOPTABLE_PROVIDERS = new Set(["google", "facebook", "sms", "phone"]);

/**
 * True when the user authenticated through a provider we offered on the
 * sign-in screen. Used as a guard on the session-adoption route.
 */
export function isAdoptableIdentity(user: User): boolean {
  const identities = user.identities;
  if (!Array.isArray(identities) || identities.length === 0) {
    // No identities array (older accounts) - fall back to the app metadata
    // provider GoTrue records on first signup.
    const provider = String(user.app_metadata?.provider ?? "");
    return ADOPTABLE_PROVIDERS.has(provider);
  }
  return identities.some((identity) =>
    ADOPTABLE_PROVIDERS.has(String(identity?.provider ?? ""))
  );
}

function displayName(user: User): string {
  const meta = user.user_metadata ?? {};
  return String(meta.full_name ?? meta.name ?? "").trim();
}

/**
 * Brings a social / phone profile in line with the sign-in we just completed.
 *
 * The `handle_new_user` trigger already created the row at signup, so this only
 * patches what a provider cannot know: the interface language the user is
 * currently browsing in, plus a name or phone number when the provider left
 * them blank. It intentionally never touches `account_type` or `email`, so a
 * merchant is not silently downgraded to a "user" by a later social login, and
 * the address GoTrue owns is not overwritten.
 *
 * Failures are warnings, never errors: the session is already valid and RLS or
 * a missing migration must not turn a successful sign-in into a 500.
 */
export async function syncAdoptedProfile(
  supabase: SupabaseClient,
  user: User,
  lang: "fr" | "ar"
): Promise<void> {
  const patch: Record<string, unknown> = { lang };
  const name = displayName(user);
  if (name) patch.full_name = name;
  const phone = String(user.phone ?? (user.user_metadata?.phone ?? ""));
  if (phone) patch.phone = phone;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select("id");

    if (error) {
      // A row that does not exist yet (account predates the trigger) cannot be
      // patched, so fall through to an insert.
      console.warn(
        `[auth] profile update for social user failed, trying insert: ${error.message}`
      );
      const insert = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email ?? "",
        full_name: name || (user.email ?? "").split("@")[0] || "",
        phone,
        account_type: "user",
        lang,
        created_at: user.created_at ?? new Date().toISOString(),
      });
      if (insert.error) {
        console.warn(`[auth] profile insert failed: ${insert.error.message}`);
      }
      return;
    }

    if (Array.isArray(data) && data.length > 0) return;
  } catch (error) {
    console.warn(
      "[auth] profile update threw:",
      error instanceof Error ? error.message : String(error)
    );
  }

  try {
    const insert = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email ?? "",
      full_name: name || (user.email ?? "").split("@")[0] || "",
      phone,
      account_type: "user",
      lang,
      created_at: user.created_at ?? new Date().toISOString(),
    });
    if (insert.error) {
      console.warn(`[auth] profile insert failed: ${insert.error.message}`);
    }
  } catch (error) {
    console.warn(
      "[auth] profile insert threw:",
      error instanceof Error ? error.message : String(error)
    );
  }
}
