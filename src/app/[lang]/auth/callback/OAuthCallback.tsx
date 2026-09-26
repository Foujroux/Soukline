"use client";

import { useEffect, useState } from "react";
import { createOAuthClient } from "@/utils/supabase/oauth-client";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
}

type Phase = "working" | "error";

/** Turns the session-adoption route's codes into something a person can read. */
function adoptionError(code: string, lang: "fr" | "ar"): string {
  const known: Record<string, { fr: string; ar: string }> = {
    OAUTH_SESSION_INVALID: {
      fr: "La session renvoyée par le fournisseur est invalide. Recommencez.",
      ar: "الجلسة التي أعادها المزوّد غير صالحة. أعد المحاولة.",
    },
    PROVIDER_NOT_ALLOWED: {
      fr: "Ce moyen de connexion n'est pas autorisé sur Souk.dz.",
      ar: "طريقة تسجيل الدخول هذه غير مسموح بها في سوقدز.",
    },
    AUTH_NOT_CONFIGURED: {
      fr: "La connexion sociale est momentanément indisponible.",
      ar: "تسجيل الدخول عبر وسائل التواصل غير متاح مؤقتًا.",
    },
    RATE_LIMITED: {
      fr: "Trop de demandes. Patientez quelques minutes avant de réessayer.",
      ar: "طلبات كثيرة جدًا. انتظر بضع دقائق ثم حاول مرة أخرى.",
    },
    INTERNAL: {
      fr: "Une erreur est survenue. Réessayez.",
      ar: "حدث خطأ ما. حاول مرة أخرى.",
    },
  };
  const entry = known[code];
  if (entry) return entry[lang];
  // Anything else is an upper-case token from our own API; hide it rather than
  // showing the user a raw code.
  return /^[A-Z][A-Z0-9_]{2,}$/.test(code)
    ? lang === "fr"
      ? "Une erreur est survenue. Réessayez."
      : "حدث خطأ ما. حاول مرة أخرى."
    : code;
}

/**
 * Completes the OAuth PKCE handshake.
 *
 * Google/Facebook send the browser back here with `?code=...`; this exchanges
 * it for a session, then hands the tokens to /api/auth/oauth/session so the
 * server writes the app's httpOnly cookies. The final step is a hard
 * navigation on purpose: a full document load re-runs proxy.ts, which is what
 * refreshes the session cookies every later request depends on.
 */
export default function OAuthCallback({ lang, dictionary }: Props) {
  const [phase, setPhase] = useState<Phase>("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fail = (text: string) => {
      if (cancelled) return;
      setMessage(text);
      setPhase("error");
    };

    const run = async () => {
      const params = new URLSearchParams(window.location.search);

      // GoTrue reports provider-side failures by redirecting back with ?error=.
      const providerError = params.get("error_description") ?? params.get("error");
      if (providerError) {
        fail(providerError);
        return;
      }

      const code = params.get("code");
      if (!code) {
        fail(
          lang === "fr"
            ? "Lien de connexion invalide ou expiré."
            : "رابط تسجيل الدخول غير صالح أو منتهي الصلاحية."
        );
        return;
      }

      let accessToken = "";
      let refreshToken = "";
      try {
        const { data, error } = await createOAuthClient().auth.exchangeCodeForSession(
          code
        );
        if (error || !data.session) {
          fail(
            error?.message ??
              (lang === "fr" ? "Échange du code impossible." : "تعذّر تبادل الرمز.")
          );
          return;
        }
        accessToken = data.session.access_token;
        refreshToken = data.session.refresh_token;
      } catch (error) {
        fail(error instanceof Error ? error.message : String(error));
        return;
      }

      try {
        const res = await fetch("/api/auth/oauth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            lang,
          }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as { error?: string } | null;
          fail(adoptionError(payload?.error ?? "INTERNAL", lang));
          return;
        }
      } catch (error) {
        fail(
          error instanceof Error
            ? error.message
            : lang === "fr"
              ? "Impossible de contacter le serveur."
              : "تعذّر الاتصال بالخادم."
        );
        return;
      }

      if (!cancelled) window.location.replace(`/${lang}/compte`);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      {phase === "working" ? (
        <>
          <div
            aria-hidden
            className="mx-auto h-10 w-10 animate-pulse rounded-full bg-emerald-600/20 ring-4 ring-emerald-100"
          />
          <p className="mt-4 text-sm font-medium text-slate-600">
            {dictionary.common.loading}
          </p>
        </>
      ) : (
        <>
          <div aria-hidden className="text-4xl">
            ⚠️
          </div>
          <h1 className="mt-3 text-lg font-extrabold text-slate-900">
            {dictionary.auth.oauthFailedTitle}
          </h1>
          <p className="mt-2 break-words text-sm text-slate-600">{message}</p>
          <a
            href={`/${lang}/connexion`}
            className="mt-5 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            {dictionary.auth.backToAuth}
          </a>
        </>
      )}
    </div>
  );
}
