"use client";

import { useEffect, useState } from "react";
import { ListingGrid } from "@/components/ListingCard";
import { sortListings, type Listing, type SortOrder } from "@/data/listings";
import type { Dictionary } from "@/lib/dictionary";
import { useHomeFilters } from "./HomeFiltersProvider";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  initialListings?: Listing[];
}

export default function HomeLatest({ lang, dictionary, initialListings }: Props) {
  const { sort, wilaya } = useHomeFilters();
  const [listings, setListings] = useState<Listing[]>(initialListings ?? []);
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
        setListings(userAds);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setListings(initialListings?.slice(0, 8) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, wilaya]);

  const resultsLabel = dictionary.filters.results.replace(
    "{count}",
    String(listings.length)
  );

  return (
    <div>
      <p className="text-sm text-slate-500" aria-live="polite">
        {loading ? dictionary.common.loading : resultsLabel}
      </p>

      <div className="mt-3">
        {loading ? <SkeletonGrid /> : <ListingGrid listings={listings} lang={lang} dictionary={dictionary} />}
      </div>
    </div>
  );
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