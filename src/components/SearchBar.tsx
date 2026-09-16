"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dictionary } from "@/lib/dictionary";

function useSearchNav(lang: string) {
  const router = useRouter();

  const navigate = (query: string, category: string, wilaya: string) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("cat", category);
    if (wilaya) params.set("w", wilaya);
    const qs = params.toString();
    router.push(`/${lang}/recherche${qs ? `?${qs}` : ""}`);
  };

  return { navigate };
}

export function SearchBar({
  lang,
  dictionary,
}: {
  lang: string;
  dictionary: Dictionary;
}) {
  const [query, setQuery] = useState("");
  const { navigate } = useSearchNav(lang);

  return (
    <form
      className="group flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(query, "", "");
      }}
    >
      <SearchIcon />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={dictionary.nav.searchPlaceholder}
        className="h-11 w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        aria-label={dictionary.nav.searchPlaceholder}
      />
      <button
        type="submit"
        className="m-1.5 shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
      >
        {dictionary.hero.searchButton}
      </button>
    </form>
  );
}

export function SearchBarMobile({
  lang,
  dictionary,
}: {
  lang: string;
  dictionary: Dictionary;
}) {
  const [query, setQuery] = useState("");
  const { navigate } = useSearchNav(lang);

  return (
    <form
      className="relative flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:hidden"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(query, "", "");
      }}
    >
      <SearchIcon />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={dictionary.nav.searchPlaceholder}
        className="h-11 w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        aria-label={dictionary.nav.searchPlaceholder}
      />
      <button
        type="submit"
        className="m-1.5 shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
      >
        {lang === "ar" ? "بحث" : "OK"}
      </button>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg
      className="mx-3 h-5 w-5 shrink-0 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  );
}