"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/client-auth";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  mode: "login" | "register";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function errorMessage(code: string, lang: "fr" | "ar"): string {
  if (lang === "ar") {
    switch (code) {
      case "INVALID_EMAIL":
        return "بريد إلكتروني غير صالح.";
      case "EMAIL_EXISTS":
        return "هذا البريد مستخدم بالفعل.";
      case "INVALID_NAME":
        return "يرجى إدخال اسم صالح (حرفان على الأقل).";
      case "WEAK_PASSWORD":
        return "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.";
      case "INVALID_CREDENTIALS":
        return "البريد أو كلمة المرور غير صحيحة.";
      case "ACCOUNT_LOCKED":
        return "تم تأمين الحساب مؤقتًا بسبب محاولات فاشلة. حاول لاحقًا.";
      case "NETWORK":
        return "تعذّر الاتصال بالخادم.";
      default:
        return "حدث خطأ. حاول مرة أخرى.";
    }
  }
  switch (code) {
    case "INVALID_EMAIL":
      return "Adresse e-mail invalide.";
    case "EMAIL_EXISTS":
      return "Cette adresse e-mail est déjà utilisée.";
    case "INVALID_NAME":
      return "Veuillez saisir un nom valide (2 caractères minimum).";
    case "WEAK_PASSWORD":
      return "Le mot de passe doit contenir au moins 6 caractères.";
    case "INVALID_CREDENTIALS":
      return "Adresse e-mail ou mot de passe incorrect.";
    case "ACCOUNT_LOCKED":
      return "Compte temporairement verrouillé après trop de tentatives. Réessayez plus tard.";
    case "NETWORK":
      return "Impossible de contacter le serveur.";
    default:
      return "Une erreur est survenue. Réessayez.";
  }
}

export default function AuthForm({ lang, dictionary, mode }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<"user" | "merchant">("user");
  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();

    if (!EMAIL_RE.test(email)) {
      setError(errorMessage("INVALID_EMAIL", lang));
      setLoading(false);
      return;
    }

    if (!isLogin) {
      if (name.length < 2) {
        setError(errorMessage("INVALID_NAME", lang));
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError(errorMessage("WEAK_PASSWORD", lang));
        setLoading(false);
        return;
      }
      const confirm = String(form.get("confirmPassword") || "");
      if (confirm !== password) {
        setError(
          lang === "fr"
            ? "Les mots de passe ne correspondent pas."
            : "كلمتا المرور غير متطابقتين."
        );
        setLoading(false);
        return;
      }
    }

    const result = isLogin
      ? await login(email, password)
      : await register({ name, email, phone, password, accountType, lang });

    if (!result.ok) {
      setError(errorMessage(result.error, lang));
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(`/${lang}/compte`);
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-extrabold text-slate-900">
          {isLogin ? dictionary.auth.login : dictionary.auth.register}
        </h1>
        <p className="mt-2 text-center text-xs text-slate-400">
          {dictionary.auth.demoHint}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                {dictionary.auth.name} *
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder={lang === "fr" ? "Ex : Ahmed Benali" : "مثال: أحمد بن علي"}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          {!isLogin && (
            <fieldset>
              <legend className="mb-1.5 block text-sm font-semibold text-slate-700">
                {dictionary.auth.accountType} *
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["user", dictionary.auth.accountUser, dictionary.auth.accountUserHint],
                    ["merchant", dictionary.auth.accountMerchant, dictionary.auth.accountMerchantHint],
                  ] as const
                ).map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAccountType(value)}
                    aria-pressed={accountType === value}
                    className={`rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
                      accountType === value
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-sm font-bold text-slate-800">{label}</span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-slate-500">
                      {hint}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
              {dictionary.auth.email} *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder={lang === "fr" ? "vous@exemple.dz" : "you@example.dz"}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
                {dictionary.auth.phone}
              </label>
              <input
                id="phone"
                name="phone"
                inputMode="tel"
                placeholder={lang === "fr" ? "0550 12 34 56" : "0550 12 34 56"}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
              {dictionary.auth.password} *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-slate-700">
                {dictionary.auth.confirmPassword} *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:brightness-110 disabled:opacity-60"
          >
            {loading ? dictionary.common.loading : isLogin ? dictionary.auth.loginBtn : dictionary.auth.registerBtn}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? dictionary.auth.noAccount : dictionary.auth.haveAccount}{" "}
          <a
            href={`/${lang}/${isLogin ? "inscription" : "connexion"}`}
            className="font-bold text-emerald-700 hover:text-emerald-800"
          >
            {isLogin ? dictionary.auth.registerLink : dictionary.auth.loginLink}
          </a>
        </p>
      </div>
    </div>
  );
}