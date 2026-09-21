"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPublicAds } from "@/lib/userAds";
import { ListingGrid } from "@/components/ListingCard";
import type { Listing, SortOrder } from "@/data/listings";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  initialListings?: Listing[];
  categorySlug?: string;
  query?: string;
  wilayaCode?: number;
  minPrice?: number;
  maxPrice?: number;
  negotiableOnly?: boolean;
  sort: SortOrder;
}

export default function SearchResults({
  lang,
  dictionary,
  initialListings,
  categorySlug,
  query,
  wilayaCode,
  minPrice,
  maxPrice,
  negotiableOnly,
  sort,
}: Props) {
  const [userListings, setUserListings] = useState<Listing[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const ads = await fetchPublicAds({
        categorySlug,
        query,
        wilayaCode,
        minPrice,
        maxPrice,
        negotiableOnly,
      });
      if (cancelled) return;
      setUserListings(ads as Listing[]);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, query, wilayaCode, minPrice, maxPrice, negotiableOnly]);

  const allListings = useMemo(() => {
    const byId = new Map<string, Listing>();
    for (const l of initialListings ?? []) {
      if (l.id) byId.set(l.id, l);
    }
    for (const l of userListings) {
      if (l.id) byId.set(l.id, l);
    }
    const combined = [...byId.values()];
    if (sort === "price_asc") return combined.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") return combined.sort((a, b) => b.price - a.price);
    if (sort === "oldest")
      return combined.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    return combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [initialListings, userListings, sort]);

  return (
    <>
      <p className="mt-1 text-sm text-slate-500">
        {allListings.length === 1
          ? `${allListings.length} ${lang === "fr" ? "annonce trouvée" : "إعلان تم العثور عليها"}`
          : `${allListings.length} ${lang === "fr" ? "annonces trouvées" : "إعلان تم العثور عليها"}`}
      </p>
      <div className="mt-5">
        <ListingGrid listings={allListings} lang={lang} dictionary={dictionary} />
      </div>
    </>
  );
}