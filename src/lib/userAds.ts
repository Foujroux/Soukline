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
  images: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  lang: "fr" | "ar";
  createdAt: string;
}

const AD_KEY = "soukdz_my_ads";
const USER_KEY = "soukdz_user";
const SAVED_KEY = "soukdz_saved";

export function getMyAds(): UserAd[] {
  try {
    return JSON.parse(localStorage.getItem(AD_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addMyAd(ad: UserAd): void {
  const ads = getMyAds();
  ads.unshift(ad);
  localStorage.setItem(AD_KEY, JSON.stringify(ads));
}

export function removeMyAd(id: string): void {
  const ads = getMyAds().filter((a) => a.id !== id);
  localStorage.setItem(AD_KEY, JSON.stringify(ads));
}

export function getSavedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getProfile(): UserProfile | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setProfile(profile: UserProfile): void {
  localStorage.setItem(USER_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("soukdz:auth"));
}

export function clearProfile(): void {
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent("soukdz:auth"));
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
  thread.messages.push({ id: crypto.randomUUID(), fromMe, text, at: new Date().toISOString() });
  thread.updatedAt = new Date().toISOString();
  saveThreads(threads);
}