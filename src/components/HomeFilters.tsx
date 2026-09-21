"use client";

import { WILAYAS } from "@/data/wilayas";
import type { SortOrder } from "@/data/listings";
import type { Dictionary } from "@/lib/dictionary";
import { useHomeFilters } from "./HomeFiltersProvider";

const SORT_ORDERS: SortOrder[] = ["newest", "oldest", "price_asc", "price_desc"];

export default function HomeFilters({
  lang,
  dictionary,
}: {
  lang: "fr" | "ar";
  dictionary: Dictionary;
}) {
  const { sort, setSort, wilaya, setWilaya } = useHomeFilters();

  return (
    <div className="mt-4 flex w-full max-w-2xl flex-col gap-2 sm:flex-row">
      <label className="flex w-full items-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-2 shadow-2xl shadow-emerald-900/20 sm:w-auto">
        <SortIcon />
        <span className="shrink-0 text-xs font-semibold text-slate-500">
          {dictionary.filters.sortBy}
        </span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOrder)}
          className="w-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none sm:w-auto sm:flex-none"
          aria-label={dictionary.filters.sortBy}
        >
          {SORT_ORDERS.map((order) => (
            <option key={order} value={order}>
              {
                {
                  newest: dictionary.filters.sortNewest,
                  oldest: dictionary.filters.sortOldest,
                  price_asc: dictionary.filters.sortPriceAsc,
                  price_desc: dictionary.filters.sortPriceDesc,
                }[order]
              }
            </option>
          ))}
        </select>
      </label>

      <label className="flex w-full items-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-2 shadow-2xl shadow-emerald-900/20 sm:w-auto">
        <PinIcon />
        <span className="shrink-0 text-xs font-semibold text-slate-500">
          {dictionary.filters.wilaya}
        </span>
        <select
          value={wilaya}
          onChange={(e) =>
            setWilaya(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 focus:outline-none sm:w-auto sm:flex-none"
          aria-label={dictionary.filters.wilaya}
        >
          <option value="">
            {lang === "fr" ? "Toute l'Algérie" : "كل الجزائر"}
          </option>
          {WILAYAS.map((w) => (
            <option key={w.code} value={w.code}>
              {lang === "fr" ? w.fr : w.ar}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function SortIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 12h8M12 18h4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}