"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyAds } from "@/lib/userAds";
import { ListingGrid } from "@/components/ListingCard";
import type { Listing, SortOrder } from "@/data/listings";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  staticListings: Listing[];
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
  staticListings,
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
    const q = query?.toLowerCase().trim();
    const userAds = getMyAds()
      .filter((l) => {
        if (categorySlug && categorySlug !== "tous" && l.categorySlug !== categorySlug)
          return false;
        if (wilayaCode && l.wilayaCode !== wilayaCode) return false;
        if (minPrice != null && !Number.isNaN(minPrice) && l.price < minPrice) return false;
        if (maxPrice != null && !Number.isNaN(maxPrice) && l.price > maxPrice) return false;
        if (negotiableOnly && !l.negotiable) return false;
        if (q) {
          const haystack =
            `${l.titleFr} ${l.titleAr} ${l.descriptionFr} ${l.descriptionAr} ${l.communeFr} ${l.communeAr} ${l.sellerFr} ${l.sellerAr}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .map((ad) => ad as Listing);
    setUserListings(userAds);
  }, [categorySlug, query, wilayaCode, minPrice, maxPrice, negotiableOnly]);

  const allListings = useMemo(() => {
    const combined = [...staticListings, ...userListings];
    const copy = [...combined];
    if (sort === "price_asc") return copy.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") return copy.sort((a, b) => b.price - a.price);
    if (sort === "oldest")
      return copy.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    return copy.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [staticListings, userListings, sort]);

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