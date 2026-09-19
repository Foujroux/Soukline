"use client";

import { useEffect, useState } from "react";
import { getCachedUser, getProfile } from "@/lib/client-auth";
import type { SessionUser } from "@/lib/auth-types";

interface Props {
  lang: "fr" | "ar";
  postAdLabel: string;
  registerLabel: string;
  fullWidth?: boolean;
}

export default function PostAdButton({ lang, postAdLabel, registerLabel, fullWidth }: Props) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(getCachedUser());

  useEffect(() => {
    const load = () => {
      getProfile().then(setUser);
    };
    load();
    window.addEventListener("soukdz:auth", load);
    return () => window.removeEventListener("soukdz:auth", load);
  }, []);

  const className =
    "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:shadow-xl hover:shadow-orange-600/30 hover:brightness-110" +
    (fullWidth ? " w-full sm:w-auto" : "");

  if (user) {
    return (
      <a href={`/${lang}/deposer`} className={className}>
        <PlusIcon />
        {postAdLabel}
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={className}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <PlusIcon />
        {postAdLabel}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute ltr:right-0 rtl:left-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <a
              href={`/${lang}/deposer`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                <PlusIcon />
              </span>
              {postAdLabel}
            </a>
            <a
              href={`/${lang}/inscription`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <UserPlusIcon />
              </span>
              {registerLabel}
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10" cy="8" r="4" />
      <path strokeLinecap="round" d="M2 21c0-3.5 3.6-5.5 8-5.5M19 8v6M16 11h6" />
    </svg>
  );
}