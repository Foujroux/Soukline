"use client";

import { useEffect, useState } from "react";
import { ListingGrid } from "@/components/ListingCard";
import { sortListings, type Listing, type SortOrder } from "@/data/listings";
import { WILAYAS } from "@/data/wilayas";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  staticListings: Listing[];
}

const SORT_ORDERS: SortOrder[] = ["newest", "oldest", "price_asc", "price_desc"];

export default function HomeLatest({ lang, dictionary, staticListings }: Props) {
  const [sort, setSort] = useState<SortOrder>("newest");
  const [wilaya, setWilaya] = useState<number | "">("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (wilaya !== "") params.set("w", String(wilaya));

    fetch(`/api/ads?${params.toString()}`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    })
      .then((res) => res.json().catch(() => null))
      .then((data) => {
        if (cancelled) return;
        const userAds = (data && Array.isArray(data.ads) ? data.ads : []) as Listing[];
        const result = mergeAndSort(staticListings, userAds, wilaya, sort);
        setListings(result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setListings(mergeAndSort(staticListings, [], wilaya, sort));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sort, wilaya, staticListings]);

  const resultsLabel = dictionary.filters.results.replace(
    "{count}",
    String(listings.length)
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white pl-3 pr-1.5 py-1.5 shadow-sm">
            <SortIcon />
            <span className="text-xs font-semibold text-slate-500">
              {dictionary.filters.sortBy}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOrder)}
              className="bg-transparent py-1 text-sm font-semibold text-slate-800 focus:outline-none"
              aria-label={dictionary.filters.sortBy}
            >
              <option value="newest">{dictionary.filters.sortNewest}</option>
              <option value="oldest">{dictionary.filters.sortOldest}</option>
              <option value="price_asc">{dictionary.filters.sortPriceAsc}</option>
              <option value="price_desc">{dictionary.filters.sortPriceDesc}</option>
            </select>
          </label>

          <label className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white pl-3 pr-1.5 py-1.5 shadow-sm">
            <PinIcon />
            <span className="text-xs font-semibold text-slate-500">
              {dictionary.filters.wilaya}
            </span>
            <select
              value={wilaya}
              onChange={(e) =>
                setWilaya(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="bg-transparent py-1 text-sm font-semibold text-slate-800 focus:outline-none"
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
        <p
          className="text-sm text-slate-500"
          aria-live="polite"
        >
          {loading ? dictionary.common.loading : resultsLabel}
        </p>
      </div>

      <div className="mt-5">
        {loading ? <SkeletonGrid /> : <ListingGrid listings={listings} lang={lang} dictionary={dictionary} />}
      </div>
    </div>
  );
}

function mergeAndSort(
  staticListings: Listing[],
  userAds: Listing[],
  wilaya: number | "",
  sort: SortOrder
): Listing[] {
  const staticFiltered = staticListings.filter(
    (l) => wilaya === "" || l.wilayaCode === wilaya
  );
  return sortListings([...staticFiltered, ...userAds], sort);
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="aspect-[4/3] bg-slate-200" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-3/4 rounded bg-slate-200" />
            <div className="h-5 w-1/2 rounded bg-slate-200" />
            <div className="h-3 w-2/3 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SortIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 12h8M12 18h4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}