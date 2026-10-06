"use client";

import { useEffect, useRef, useState } from "react";
import { clearProfile, getCachedUser, getProfile } from "@/lib/client-auth";
import type { SessionUser } from "@/lib/auth-types";

export default function AuthLink({
  lang,
  loginLabel,
  accountLabel,
  messagesLabel,
  myAdsLabel,
  settingsLabel,
  logoutLabel,
}: {
  lang: "fr" | "ar";
  loginLabel: string;
  accountLabel: string;
  messagesLabel: string;
  myAdsLabel: string;
  settingsLabel: string;
  logoutLabel: string;
}) {
  const [user, setUser] = useState<SessionUser | null>(getCachedUser());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      getProfile().then(setUser);
    };
    load();
    window.addEventListener("soukdz:auth", load);
    return () => window.removeEventListener("soukdz:auth", load);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) {
    return (
      <a
        href={`/${lang}/connexion`}
        className="block w-full rounded-xl bg-gradient-to-r from-yellow-400 to-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white shadow transition-colors hover:brightness-110"
      >
        {loginLabel}
      </a>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="block w-full rounded-xl bg-gradient-to-r from-yellow-400 to-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white shadow transition-colors hover:brightness-110"
      >
        {accountLabel}{user.name ? ` · ${user.name}` : ""}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
          <a
            href={`/${lang}/messages`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-blue-600"
            onClick={() => setOpen(false)}
          >
            💬 {messagesLabel}
          </a>
          <a
            href={`/${lang}/compte?tab=ads`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-blue-600"
            onClick={() => setOpen(false)}
          >
            📢 {myAdsLabel}
          </a>
          <a
            href={`/${lang}/compte?tab=settings`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-blue-600"
            onClick={() => setOpen(false)}
          >
            ⚙️ {settingsLabel}
          </a>
          <a
            href={`/${lang}/compte`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-blue-600"
            onClick={() => setOpen(false)}
          >
            👤 {accountLabel}
          </a>
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
              🚪 {logoutLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
