"use client";

import { useEffect, useState } from "react";
import { accountTypeLabel, clearProfile, getProfile } from "@/lib/client-auth";
import type { SessionUser } from "@/lib/auth-types";

interface Props {
  lang: "fr" | "ar";
  loginLabel: string;
  accountLabel: string;
  logoutLabel: string;
  myAdsLabel: string;
  messagesLabel: string;
}

export default function UserMenu({
  lang,
  loginLabel,
  accountLabel,
  logoutLabel,
  myAdsLabel,
  messagesLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const load = () => {
      getProfile().then((u) => {
        setUser(u);
        setMounted(true);
      });
    };
    load();
    window.addEventListener("soukdz:auth", load);
    return () => window.removeEventListener("soukdz:auth", load);
  }, []);

  if (!mounted) return null;

  if (!user) {
    return (
      <a
        href={`/${lang}/connexion`}
        className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-600 hover:text-emerald-700 md:flex"
      >
        <UserIcon />
        {loginLabel}
      </a>
    );
  }

  const initial = user.name?.charAt(0)?.toUpperCase() ?? user.email.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-600 hover:text-emerald-700"
        aria-label={accountLabel}
      >
        <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-xs font-bold text-white">
          {initial}
        </div>
        <span className="hidden lg:inline truncate max-w-[100px]">{user.name.split(" ")[0]}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute ltr:right-0 rtl:left-0 z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <span
                className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  user.accountType === "admin"
                    ? "bg-violet-100 text-violet-700"
                    : user.accountType === "merchant"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {accountTypeLabel(user.accountType, lang)}
              </span>
            </div>
            <div className="py-1">
              <a
                href={`/${lang}/compte?tab=ads`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                onClick={() => setOpen(false)}
              >
                <span>📢</span> {myAdsLabel}
              </a>
              <a
                href={`/${lang}/messages`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                onClick={() => setOpen(false)}
              >
                <span>💬</span> {messagesLabel}
              </a>
            </div>
            <div className="border-t border-slate-100 pt-1">
              <button
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await clearProfile();
                  window.location.href = `/${lang}`;
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogoutIcon />
                {logoutLabel}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}