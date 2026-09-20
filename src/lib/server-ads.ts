import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import {
  sanitizeText,
  sanitizePhone,
  sanitizeEmail,
  sanitizeName,
} from "@/lib/sanitize";
import type { AccountType } from "@/lib/auth-types";
import type { UserAd } from "@/lib/userAds";

const ADS_FILE = path.join(tmpdir(), "soukline", "ads.json");

export interface StoredAd extends UserAd {
  ownerId: string;
}

let adsCache: StoredAd[] | null = null;

async function ensureStore(): Promise<StoredAd[]> {
  if (adsCache) return adsCache;
  try {
    const raw = await readFile(ADS_FILE, "utf8");
    adsCache = JSON.parse(raw) as StoredAd[];
  } catch {
    adsCache = [];
  }
  return adsCache;
}

async function writeStore(): Promise<void> {
  if (!adsCache) return;
  await mkdir(path.dirname(ADS_FILE), { recursive: true });
  await writeFile(ADS_FILE, JSON.stringify(adsCache, null, 2), "utf8");
}

export function toPublicAd(ad: StoredAd): UserAd {
  const { ownerId: _ownerId, ...pub } = ad;
  return pub;
}

export async function listAds(): Promise<StoredAd[]> {
  return ensureStore();
}

export async function listPublicAds(): Promise<UserAd[]> {
  return (await ensureStore()).map(toPublicAd);
}

export async function getAdBySlug(slug: string): Promise<StoredAd | undefined> {
  return (await ensureStore()).find((a) => a.slug === slug);
}

export async function getAdsByOwner(ownerId: string): Promise<StoredAd[]> {
  return (await ensureStore()).filter((a) => a.ownerId === ownerId);
}

function uniqSlug(base: string, existing: Set<string>): string {
  let slug = base;
  let n = 2;
  while (existing.has(slug)) {
    slug = `${base.slice(0, 54)}-${n++}`;
  }
  existing.add(slug);
  return slug;
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export async function addAd(input: {
  ownerId: string;
  accountType: AccountType;
  data: Omit<UserAd, "id" | "slug" | "createdAt" | "views" | "featured">;
}): Promise<UserAd> {
  const ads = await ensureStore();
  const existingSlugs = new Set(ads.map((a) => a.slug));
  const titleFr = sanitizeText(input.data.titleFr, 90);
  const titleAr = sanitizeText(input.data.titleAr, 90);
  const rawTitle = titleFr || titleAr;
  if (!rawTitle) throw new Error("TITLE_REQUIRED");

  const slug = uniqSlug(toSlug(rawTitle) || "annonce", existingSlugs);
  const ad: StoredAd = {
    id: randomBytes(16).toString("hex"),
    slug,
    categorySlug: sanitizeText(input.data.categorySlug, 40) || "services",
    titleFr,
    titleAr,
    descriptionFr: sanitizeText(input.data.descriptionFr, 2000),
    descriptionAr: sanitizeText(input.data.descriptionAr, 2000),
    price: Math.max(0, Math.floor(Number(input.data.price) || 0)),
    currency: "DA",
    wilayaCode: Math.floor(Number(input.data.wilayaCode) || 0),
    communeFr: sanitizeText(input.data.communeFr, 80),
    communeAr: sanitizeText(input.data.communeAr, 80),
    conditionFr: sanitizeText(input.data.conditionFr, 40),
    conditionAr: sanitizeText(input.data.conditionAr, 40),
    sellerFr: sanitizeName(input.data.sellerFr || input.data.sellerAr),
    sellerAr: sanitizeName(input.data.sellerAr || input.data.sellerFr),
    phone: sanitizePhone(input.data.phone),
    email: sanitizeEmail(input.data.email),
    createdAt: new Date().toISOString(),
    views: 0,
    featured: false,
    negotiable: Boolean(input.data.negotiable),
    accountType: input.accountType,
    images: Array.isArray(input.data.images)
      ? input.data.images
          .filter((src): src is string => typeof src === "string")
          .map((s) => String(s).slice(0, 2_000_000))
          .slice(0, 8)
      : [],
    ownerId: input.ownerId,
  };
  ads.unshift(ad);
  await writeStore();
  return toPublicAd(ad);
}

export async function deleteAd(
  slug: string,
  actor: { id: string; accountType: AccountType }
): Promise<boolean> {
  const ads = await ensureStore();
  const idx = ads.findIndex((a) => a.slug === slug);
  if (idx === -1) return false;
  const ad = ads[idx];
  if (ad.ownerId !== actor.id && actor.accountType !== "admin") {
    throw new Error("FORBIDDEN");
  }
  ads.splice(idx, 1);
  await writeStore();
  return true;
}