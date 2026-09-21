export interface Listing {
  id: string;
  slug: string;
  categorySlug: string;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  price: number;
  currency: string;
  wilayaCode: number;
  communeFr: string;
  communeAr: string;
  sellerFr: string;
  sellerAr: string;
  phone: string;
  email: string;
  createdAt: string;
  views: number;
  featured: boolean;
  negotiable: boolean;
  images: string[];
  conditionFr: string;
  conditionAr: string;
}

export function formatPrice(price: number, lang: "fr" | "ar"): string {
  const formatted = new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : "fr-DZ", {
    maximumFractionDigits: 0,
  }).format(price);
  return lang === "ar" ? `${formatted} دج` : `${formatted} DA`;
}

export interface ListingFilters {
  query?: string;
  categorySlug?: string;
  wilayaCode?: number;
  minPrice?: number;
  maxPrice?: number;
  negotiableOnly?: boolean;
}

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function searchListings(
  listings: Listing[],
  filters: ListingFilters
): Listing[] {
  return listings.filter((l) => {
    if (filters.categorySlug && filters.categorySlug !== "tous" && l.categorySlug !== filters.categorySlug)
      return false;
    if (filters.wilayaCode && l.wilayaCode !== filters.wilayaCode) return false;
    if (filters.minPrice != null && !Number.isNaN(filters.minPrice) && l.price < filters.minPrice) return false;
    if (filters.maxPrice != null && !Number.isNaN(filters.maxPrice) && l.price > filters.maxPrice) return false;
    if (filters.negotiableOnly && !l.negotiable) return false;
    if (filters.query) {
      const q = normalizeSearchText(filters.query);
      const haystack = normalizeSearchText(
        `${l.titleFr} ${l.titleAr} ${l.descriptionFr} ${l.descriptionAr} ${l.communeFr} ${l.communeAr} ${l.sellerFr} ${l.sellerAr}`
      );
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export type SortOrder = "newest" | "oldest" | "price_asc" | "price_desc";

export function sortListings(listings: Listing[], sort: SortOrder): Listing[] {
  const copy = [...listings];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

export function getSimilarListings(
  listings: Listing[],
  listing: Listing,
  count = 4
): Listing[] {
  return listings.filter(
    (l) => l.categorySlug === listing.categorySlug && l.id !== listing.id
  ).slice(0, count);
}