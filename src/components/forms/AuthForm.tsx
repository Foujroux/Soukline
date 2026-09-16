"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, setProfile, type UserProfile } from "@/lib/userAds";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  mode: "login" | "register";
}

export default function AuthForm({ lang, dictionary, mode }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();

    if (!isLogin) {
      if (!name || name.length < 2) {
        setError(lang === "fr" ? "Veuillez saisir votre nom." : "يرجى إدخال اسمك.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError(
          lang === "fr"
            ? "Le mot de passe doit contenir au moins 6 caractères."
            : "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
        );
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

    const existing = getProfile();
    if (isLogin) {
      if (!existing || existing.email !== email) {
        // Demo mode: allow login with any credentials
        const profile: UserProfile = {
          name: existing?.name ?? (name || email.split("@")[0]),
          email,
          phone: existing?.phone ?? "",
          lang,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        };
        setProfile(profile);
      }
    } else {
      const profile: UserProfile = {
        name,
        email,
        phone,
        lang,
        createdAt: new Date().toISOString(),
      };
      setProfile(profile);
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