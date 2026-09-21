import { sanitizeText } from "@/lib/sanitize";
import type { AccountType } from "@/lib/auth-types";

export interface UserAd {
  id: string;
  slug: string;
  categorySlug: string;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  price: number;
  currency: "DA";
  wilayaCode: number;
  communeFr: string;
  communeAr: string;
  conditionFr: string;
  conditionAr: string;
  sellerFr: string;
  sellerAr: string;
  phone: string;
  email: string;
  createdAt: string;
  views: number;
  featured: boolean;
  negotiable: boolean;
  accountType?: AccountType;
  images: string[];
}

const AD_KEY = "soukdz_my_ads";
const SAVED_KEY = "soukdz_saved";
const MIGRATION_KEY = "soukdz_ad_migrated";

function getLocalAds(): UserAd[] {
  try {
    return JSON.parse(localStorage.getItem(AD_KEY) || "[]");
  } catch {
    return [];
  }
}

function clearLocalAds(): void {
  try {
    localStorage.removeItem(AD_KEY);
  } catch {
    // ignore
  }
}

async function migrateLegacyAds(): Promise<boolean> {
  const local = getLocalAds();
  if (local.length === 0) return false;
  if (localStorage.getItem(MIGRATION_KEY) === "1") {
    clearLocalAds();
    return false;
  }
  let ok = true;
  await Promise.all(
    local.map(async (ad) => {
      try {
        await publishAd(ad);
      } catch {
        ok = false;
      }
    })
  );
  if (ok) {
    try {
      localStorage.setItem(MIGRATION_KEY, "1");
    } catch {
      // ignore
    }
    clearLocalAds();
    return true;
  }
  return false;
}

export async function fetchPublicAds(filters?: {
  categorySlug?: string;
  query?: string;
  wilayaCode?: number;
  minPrice?: number;
  maxPrice?: number;
  negotiableOnly?: boolean;
}): Promise<UserAd[]> {
  const params = new URLSearchParams();
  if (filters?.categorySlug) params.set("category", filters.categorySlug);
  if (filters?.query) params.set("q", filters.query);
  if (filters?.wilayaCode != null) params.set("w", String(filters.wilayaCode));
  if (filters?.minPrice != null) params.set("min", String(filters.minPrice));
  if (filters?.maxPrice != null) params.set("max", String(filters.maxPrice));
  if (filters?.negotiableOnly) params.set("neg", "1");
  const qs = params.toString();
  try {
    const res = await fetch(`/api/ads${qs ? `?${qs}` : ""}`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => null)) as { ads?: UserAd[] } | null;
    return Array.isArray(data?.ads) ? data.ads : [];
  } catch {
    return [];
  }
}

export async function fetchMyAds(): Promise<UserAd[]> {
  await migrateLegacyAds();
  try {
    const res = await fetch("/api/ads/mine", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => null)) as { ads?: UserAd[] } | null;
    return Array.isArray(data?.ads) ? data.ads : [];
  } catch {
    return [];
  }
}

export async function fetchAdBySlug(slug: string): Promise<UserAd | null> {
  try {
    const res = await fetch(`/api/ads/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => null)) as { ad?: UserAd } | null;
    return data?.ad ?? null;
  } catch {
    return null;
  }
}

export async function publishAd(ad: UserAd): Promise<UserAd> {
  const res = await fetch("/api/ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(ad),
  });
  const data = (await res.json().catch(() => null)) as { ad?: UserAd; error?: string } | null;
  if (!res.ok || !data?.ad) {
    throw new Error(data?.error === "UNAUTHORIZED" ? "UNAUTHORIZED" : "FAILED_TO_PUBLISH");
  }
  return data.ad;
}

export async function deleteMyAd(slug: string): Promise<void> {
  const res = await fetch(`/api/ads/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error("DELETE_FAILED");
  }
}

export function getSavedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
  } catch {
    return [];
  }
}

export async function fetchSavedAds(): Promise<UserAd[]> {
  const slugs = getSavedIds();
  const ads = await Promise.all(slugs.map((slug) => fetchAdBySlug(slug)));
  return ads.filter((ad): ad is UserAd => Boolean(ad));
}

export const CONDITIONS = {
  new: { fr: "Neuf", ar: "جديد" },
  veryGood: { fr: "Très bon état", ar: "حالة جيدة جدًا" },
  good: { fr: "Bon état", ar: "حالة جيدة" },
  fair: { fr: "État moyen", ar: "حالة متوسطة" },
  used: { fr: "Occasion", ar: "مستعمل" },
} as const;

export type ConditionKey = keyof typeof CONDITIONS;

export function conditionLabel(key: string, lang: "fr" | "ar") {
  return CONDITIONS[key as ConditionKey]?.[lang] ?? "-";
}

export interface ThreadMessage {
  id: string;
  fromMe: boolean;
  text: string;
  at: string;
}

export interface Thread {
  id: string;
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  sellerName: string;
  lang: string;
  messages: ThreadMessage[];
  createdAt: string;
  updatedAt: string;
}

const THREAD_KEY = "soukdz_threads";

export function getThreads(): Thread[] {
  try {
    return JSON.parse(localStorage.getItem(THREAD_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveThreads(threads: Thread[]): void {
  localStorage.setItem(THREAD_KEY, JSON.stringify(threads));
  window.dispatchEvent(new CustomEvent("soukdz:threads"));
}

export function addThreadMessage(threadId: string, text: string, fromMe: boolean): void {
  const threads = getThreads();
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return;
  thread.messages.push({
    id: crypto.randomUUID(),
    fromMe,
    text: sanitizeText(text, 2000),
    at: new Date().toISOString(),
  });
  thread.updatedAt = new Date().toISOString();
  saveThreads(threads);
}