"use client";

import { useEffect, useState } from "react";
import { getCachedUser, getProfile } from "@/lib/client-auth";
import type { SessionUser } from "@/lib/auth-types";

export default function AuthLink({
  lang,
  loginLabel,
  accountLabel,
}: {
  lang: "fr" | "ar";
  loginLabel: string;
  accountLabel: string;
}) {
  const [user, setUser] = useState<SessionUser | null>(getCachedUser());

  useEffect(() => {
    const load = () => {
      getProfile().then(setUser);
    };
    load();
    window.addEventListener("soukdz:auth", load);
    return () => window.removeEventListener("soukdz:auth", load);
  }, []);

  return (
    <a
      href={user ? `/${lang}/compte` : `/${lang}/connexion`}
      className="block w-full rounded-xl bg-gradient-to-r from-yellow-400 to-red-500 px-4 py-2.5 text-center text-sm font-bold text-white shadow transition-colors hover:brightness-110"
    >
      {user ? accountLabel : loginLabel}
    </a>
  );
}
