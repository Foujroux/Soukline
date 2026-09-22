import { createBrowserClient } from "@supabase/ssr";
import {
  authHeaders,
  isSupabaseConfigured,
  supabaseKey,
  supabaseUrl,
} from "./config";

export const createClient = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }
  // The browser client never manages its own session/cookies (the app's auth
  // flows go through /api/auth/*), so disable all implicit persistence and
  // URL-token detection. Headers are passed explicitly to support both the
  // legacy JWT anon key and the new "sb_publishable_..." key format.
  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: authHeaders(),
    },
  });
};