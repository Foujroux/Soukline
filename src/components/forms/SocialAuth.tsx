"use client";

import { useEffect, useRef, useState } from "react";
import { toAlgeriaE164 } from "@/lib/phone";
import {
  createOAuthClient,
  isOAuthProvider,
  type OAuthProvider,
} from "@/utils/supabase/oauth-client";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  mode: "login" | "register";
}

type Stage = "idle" | "codeSent";

/** Phone/OAuth failures translated for the person looking at the screen. */
function message(code: string, lang: "fr" | "ar"): string {
  const known: Record<string, { fr: string; ar: string }> = {
    PHONE_INVALID: {
      fr: "Numéro invalide. Exemple : 0550 12 34 56",
      ar: "رقم غير صالح. مثال: 0550 12 34 56",
    },
    OTP_SEND_FAILED: {
      fr: "Impossible d'envoyer le SMS. Réessayez.",
      ar: "تعذّر إرسال الرسالة. حاول مرة أخرى.",
    },
    OTP_INVALID: {
      fr: "Code incorrect. Vérifiez et réessayez.",
      ar: "الرمز غير صحيح. تحقق وأعد المحاولة.",
    },
    OTP_EXPIRED: {
      fr: "Code expiré. Demandez-en un nouveau.",
      ar: "انتهت صلاحية الرمز. اطلب رمزًا جديدًا.",
    },
    RATE_LIMITED: {
      fr: "Trop de demandes. Patientez quelques minutes.",
      ar: "طلبات كثيرة جدًا. انتظر بضع دقائق.",
    },
    PHONE_NOT_ALLOWED: {
      fr: "Ce numéro n'est pas autorisé à s'inscrire.",
      ar: "هذا الرقم غير مسموح له بالتسجيل.",
    },
    SIGNUPS_DISABLED: {
      fr: "L'inscription est temporairement désactivée.",
      ar: "التسجيل معطّل مؤقتًا.",
    },
    SMS_UNAVAILABLE: {
      fr: "La connexion par SMS n'est pas disponible pour le moment.",
      ar: "تسجيل الدخول عبر الرسائل غير متاح حاليًا.",
    },
    SOCIAL_UNAVAILABLE: {
      fr: "La connexion sociale n'est pas configurée pour le moment.",
      ar: "تسجيل الدخول عبر وسائل التواصل غير مُهيّأ حاليًا.",
    },
    AUTH_NOT_CONFIGURED: {
      fr: "La connexion est momentanément indisponible.",
      ar: "تسجيل الدخول غير متاح مؤقتًا.",
    },
    NETWORK: {
      fr: "Impossible de contacter le serveur.",
      ar: "تعذّر الاتصال بالخادم.",
    },
    INTERNAL: {
      fr: "Une erreur est survenue. Réessayez.",
      ar: "حدث خطأ ما. حاول مرة أخرى.",
    },
  };
  const entry = known[code];
  if (entry) return entry[lang];
  return /^[A-Z][A-Z0-9_]{2,}$/.test(code)
    ? lang === "fr"
      ? "Une erreur est survenue. Réessayez."
      : "حدث خطأ ما. حاول مرة أخرى."
    : code;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

const socialButtonClass =
  "flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-60";

/**
 * Sign-in methods offered above the email/password form: Google, Facebook and
 * a phone SMS one-time code.
 *
 * Which of the three are actually rendered comes from /api/auth/providers,
 * which reads the Supabase project's own auth settings. A provider the project
 * has not enabled is hidden rather than shown and left to fail - a button that
 * always errors is worse than no button.
 */
export default function SocialAuth({ lang, dictionary, mode }: Props) {
  const [googleOn, setGoogleOn] = useState(false);
  const [facebookOn, setFacebookOn] = useState(false);
  const [smsOn, setSmsOn] = useState(false);
  const [probed, setProbed] = useState(false);

  const [stage, setStage] = useState<Stage>("idle");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"" | OAuthProvider | "send" | "verify">("");
  const [error, setError] = useState("");

  // Kept in a ref so a resend does not need the state update to have landed.
  const phoneRef = useRef(phone);
  phoneRef.current = phone;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/providers", { cache: "no-store", credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { google?: boolean; facebook?: boolean; sms?: boolean } | null) => {
        if (cancelled || !data) return;
        setGoogleOn(data.google === true);
        setFacebookOn(data.facebook === true);
        setSmsOn(data.sms === true);
      })
      .catch(() => {
        // Probe failed: the email/password form below is still fully usable.
      })
      .finally(() => {
        if (!cancelled) setProbed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const anySocial = googleOn || facebookOn;
  // Render nothing until the probe resolves, and nothing at all when the
  // project has no extra method enabled. Without the `probed` guard the
  // component would first paint a bare "or" divider above the form and only
  // then fill in, which reads as a broken layout.
  if (!probed) return null;
  if (!anySocial && !smsOn) return null;

  async function startOAuth(provider: OAuthProvider) {
    setError("");
    setBusy(provider);
    try {
      const { data, error: oauthError } = await createOAuthClient().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/${lang}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (oauthError || !data?.url) {
        setError(message("SOCIAL_UNAVAILABLE", lang));
        setBusy("");
        return;
      }
      // The provider handles the rest; the callback page finishes the flow.
      window.location.assign(data.url);
    } catch (err) {
      console.error("[client] signInWithOAuth threw:", err);
      setError(message("NETWORK", lang));
      setBusy("");
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const e164 = toAlgeriaE164(phone);
    if (!e164) {
      setError(message("PHONE_INVALID", lang));
      return;
    }
    setPhone(e164);

    setBusy("send");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone: e164 }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(message(payload?.error ?? "OTP_SEND_FAILED", lang));
        return;
      }
      setStage("codeSent");
    } catch {
      setError(message("NETWORK", lang));
    } finally {
      setBusy("");
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const token = code.trim();
    if (!/^\d{4,8}$/.test(token)) {
      setError(message("OTP_INVALID", lang));
      return;
    }

    setBusy("verify");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ phone: phoneRef.current, token, lang }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(message(payload?.error ?? "OTP_INVALID", lang));
        return;
      }
      // Hard navigation: the session now lives in cookies set by the route
      // handler, and every client component reads it from /api/auth/me.
      window.location.replace(`/${lang}/compte`);
    } catch {
      setError(message("NETWORK", lang));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-6">
      {anySocial && (
        <>
          <OrDivider label={dictionary.auth.orContinueWith} />
          <div className="flex flex-col gap-2 sm:flex-row">
            {googleOn && (
              <button
                type="button"
                onClick={() => startOAuth("google")}
                disabled={busy !== ""}
                className={socialButtonClass}
              >
                <GoogleIcon />
                {dictionary.auth.continueWithGoogle}
              </button>
            )}
            {facebookOn && (
              <button
                type="button"
                onClick={() => startOAuth("facebook")}
                disabled={busy !== ""}
                className={socialButtonClass}
              >
                <FacebookIcon />
                {dictionary.auth.continueWithFacebook}
              </button>
            )}
          </div>
        </>
      )}

      {smsOn && (
        <>
          {anySocial && <OrDivider label={dictionary.auth.or} />}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-800">
              {dictionary.auth.signInWithPhone}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {mode === "register"
                ? dictionary.auth.phoneAccountHint
                : dictionary.auth.phoneHint}
            </p>

            {stage === "idle" ? (
              <form onSubmit={sendCode} className="mt-3 space-y-2">
                <label htmlFor="otpPhone" className="sr-only">
                  {dictionary.auth.phone}
                </label>
                <input
                  id="otpPhone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550 12 34 56"
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={busy !== ""}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy === "send" ? dictionary.common.loading : dictionary.auth.sendCode}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-emerald-700">
                  {dictionary.auth.codeSent}
                </p>
                <label htmlFor="otpCode" className="sr-only">
                  {dictionary.auth.enterCode}
                </label>
                <input
                  id="otpCode"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={8}
                  dir="ltr"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  className={`${inputClass} text-center text-lg font-bold tracking-[0.4em]`}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy !== ""}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy === "verify" ? dictionary.common.loading : dictionary.auth.verify}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setCode("");
                      setStage("idle");
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    {dictionary.auth.changeNumber}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      {error && (
        <p
          className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Rendered last so the email/password form below is always visually
          separated, and skipped entirely when no method is available. */}
      <OrDivider label={dictionary.auth.orEmail} />
    </div>
  );
}

function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.45a5.52 5.52 0 01-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.86z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11A12 12 0 0012 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 010-4.56V6.61H1.28a12 12 0 000 10.78l3.99-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.28 6.61l3.99 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
