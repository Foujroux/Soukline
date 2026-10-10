import {
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
  sanitizeText,
} from "@/lib/sanitize";
import type { AccountType } from "@/lib/auth-types";
import { maxAdsFor, maxImagesFor } from "@/lib/ads-limits";
import { after } from "next/server";
import {
  needsTranslation,
  translateAd,
  withoutTranslation,
  type TranslatableAd,
} from "@/lib/translate";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserAd } from "@/lib/userAds";
import { createAnonClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/config";

const ADS_TABLE = "listings";

export interface StoredAd extends UserAd {
  ownerId: string;
}

interface ListingRow {
  id: string;
  user_id: string;
  slug: string;
  category_slug: string | null;
  title_fr: string | null;
  title_ar: string | null;
  description_fr: string | null;
  description_ar: string | null;
  price: number | string | null;
  currency: string | null;
  wilaya_code: number | null;
  commune_fr: string | null;
  commune_ar: string | null;
  condition_fr: string | null;
  condition_ar: string | null;
  seller_fr: string | null;
  seller_ar: string | null;
  phone: string | null;
  email: string | null;
  views: number | null;
  featured: boolean | null;
  negotiable: boolean | null;
  account_type: string | null;
  images: string[] | null;
  created_at: string | null;
}

let warnedOnce = false;

function warnDbHint(error: { message?: string } | null, operation: string): void {
  if (!error) return;
  if (!warnedOnce) {
    warnedOnce = true;
    console.warn(
      `[ads] ${operation}: Supabase returned: ${error.message}. ` +
        "Make sure the `listings` table exists (run supabase/schema.sql) and RLS " +
        "policies allow public reads."
    );
  } else {
    console.warn(`[ads] ${operation}: ${error.message}`);
  }
}

function getSupabase() {
  return createAnonClient();
}

export function toPublicAd(ad: StoredAd): UserAd {
  const { ownerId: _ownerId, ...pub } = ad;
  return pub;
}

function rowToAd(row: ListingRow): StoredAd {
  return {
    id: row.id,
    ownerId: row.user_id,
    slug: row.slug,
    categorySlug: row.category_slug ?? "services",
    // New ads get both languages filled by translateAd. Rows written before
    // that still have one side empty, and the UI picks a column purely by the
    // viewer's language, so fall back here or the Arabic view renders a blank
    // title for a listing that plainly has one.
    titleFr: row.title_fr || row.title_ar || "",
    titleAr: row.title_ar || row.title_fr || "",
    descriptionFr: row.description_fr || row.description_ar || "",
    descriptionAr: row.description_ar || row.description_fr || "",
    price: Number(row.price ?? 0),
    currency: "DA",
    wilayaCode: Number(row.wilaya_code ?? 0),
    communeFr: row.commune_fr || row.commune_ar || "",
    communeAr: row.commune_ar || row.commune_fr || "",
    conditionFr: row.condition_fr || row.condition_ar || "",
    conditionAr: row.condition_ar || row.condition_fr || "",
    sellerFr: row.seller_fr || row.seller_ar || "",
    sellerAr: row.seller_ar || row.seller_fr || "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
    views: Number(row.views ?? 0),
    featured: Boolean(row.featured),
    negotiable: Boolean(row.negotiable),
    accountType: (row.account_type as AccountType | null) ?? undefined,
    images: Array.isArray(row.images) ? row.images : [],
  };
}

export async function listAds(): Promise<StoredAd[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(ADS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      warnDbHint(error, "listAds");
      return [];
    }
    return (data ?? []).map(rowToAd);
  } catch (err) {
    warnDbHint({ message: err instanceof Error ? err.message : String(err) }, "listAds");
    return [];
  }
}

export async function listPublicAds(): Promise<UserAd[]> {
  return (await listAds()).map(toPublicAd);
}

export async function getAdBySlug(slug: string): Promise<StoredAd | undefined> {
  if (!isSupabaseConfigured()) return undefined;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(ADS_TABLE)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) {
      warnDbHint(error, "getAdBySlug");
      return undefined;
    }
    return rowToAd(data as ListingRow);
  } catch (err) {
    warnDbHint({ message: err instanceof Error ? err.message : String(err) }, "getAdBySlug");
    return undefined;
  }
}

export async function getAdsByOwner(ownerId: string): Promise<StoredAd[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(ADS_TABLE)
      .select("*")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) {
      warnDbHint(error, "getAdsByOwner");
      return [];
    }
    return (data ?? []).map(rowToAd);
  } catch (err) {
    warnDbHint({ message: err instanceof Error ? err.message : String(err) }, "getAdsByOwner");
    return [];
  }
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

/**
 * Fills in a listing's missing language after the response has been sent.
 *
 * This used to happen inline, before the insert, which meant posting an ad
 * waited on Gemini: measured from a phone, that was a 0.25s failure half the
 * time and a 17s success otherwise, because the free tier returns 503 "high
 * demand" for roughly every other call. Paying that before the seller sees
 * their own listing was the wrong trade.
 *
 * Deferring it means the post returns as soon as the row is written. If this
 * never runs, or runs and fails, the listing is still readable in both
 * languages because stored already copied the source text into both columns —
 * so the worst case is an untranslated listing, never a blank one.
 */
function scheduleTranslation(
  client: SupabaseClient,
  row: ListingRow,
  original: TranslatableAd
): void {
  if (!needsTranslation(original)) return;

  const target: "fr" | "ar" = original.title_ar ? "fr" : "ar";
  const source: "fr" | "ar" = target === "ar" ? "fr" : "ar";

  // after() throws when there is no request scope, so registering it must not
  // be able to fail an insert that has already succeeded. Today addAd is only
  // reached from a route handler, but a build or a script calling it directly
  // would otherwise turn a successful post into an exception.
  try {
    after(async () => {
      try {
        const translated = await translateAd(original);

        const patch: Record<string, string> = {};
        for (const field of ["title", "description", "commune", "condition", "seller"] as const) {
          const key = `${field}_${target}` as keyof TranslatableAd;
          const value = String(translated[key] ?? "").trim();
          const sourceText = String(original[`${field}_${source}` as keyof TranslatableAd] ?? "").trim();
          // Identical to the source means translateAd fell back to copying it
          // across, i.e. the model produced nothing worth writing.
          if (value && value !== sourceText) patch[key] = value;
        }
        if (Object.keys(patch).length === 0) return;

        const { error } = await client
          .from(ADS_TABLE)
          .update(patch)
          .eq("id", row.id);
        if (error) console.warn("[ads] translation update failed:", error.message);
      } catch (error) {
        console.warn("[ads] translation skipped:", (error as Error)?.message);
      }
    });
  } catch (error) {
    console.warn(
      "[ads] translation not scheduled, no request scope:",
      (error as Error)?.message
    );
  }
}

export async function addAd(
  client: SupabaseClient,
  input: {
    ownerId: string;
    accountType: AccountType;
    data: Omit<UserAd, "id" | "slug" | "createdAt" | "views" | "featured">;
  }
): Promise<UserAd> {
  if (!isSupabaseConfigured()) {
    throw new Error("DATABASE_NOT_CONFIGURED");
  }

  const maxImages = maxImagesFor(input.accountType);
  const maxAds = maxAdsFor(input.accountType);

  const { count, error: countError } = await client
    .from(ADS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.ownerId);
  if (countError) throw new Error("DATABASE_ERROR");
  if ((count ?? 0) >= maxAds) throw new Error("AD_LIMIT_REACHED");

  const titleFr = sanitizeText(input.data.titleFr, 90);
  const titleAr = sanitizeText(input.data.titleAr, 90);
  const rawTitle = titleFr || titleAr;
  if (!rawTitle) throw new Error("TITLE_REQUIRED");

  const images = Array.isArray(input.data.images)
    ? input.data.images
        .filter((src): src is string => typeof src === "string")
        .map((s) => String(s).slice(0, 2_000_000))
        .slice(0, maxImages)
    : [];

  const base = {
    user_id: input.ownerId,
    category_slug: sanitizeText(input.data.categorySlug, 40) || "services",
    title_fr: titleFr,
    title_ar: titleAr,
    description_fr: sanitizeText(input.data.descriptionFr, 2000),
    description_ar: sanitizeText(input.data.descriptionAr, 2000),
    price: Math.max(0, Math.floor(Number(input.data.price) || 0)),
    currency: "DA",
    wilaya_code: Math.floor(Number(input.data.wilayaCode) || 0),
    commune_fr: sanitizeText(input.data.communeFr, 80),
    commune_ar: sanitizeText(input.data.communeAr, 80),
    condition_fr: sanitizeText(input.data.conditionFr, 40),
    condition_ar: sanitizeText(input.data.conditionAr, 40),
    seller_fr: sanitizeName(input.data.sellerFr || input.data.sellerAr),
    seller_ar: sanitizeName(input.data.sellerAr || input.data.sellerFr),
    phone: sanitizePhone(input.data.phone),
    email: sanitizeEmail(input.data.email),
    negotiable: Boolean(input.data.negotiable),
    account_type: input.accountType,
    images,
    created_at: new Date().toISOString(),
  };

  // The post form is written in one language, so the other column usually
  // arrives empty. Store the source text in both right away: the row is
  // immediately readable in either language, and the ad is never blocked on
  // an external translation call. toPublicAd() falls back across languages, so
  // this is enough for correctness on its own.
  const stored = withoutTranslation(base);

  const supabase = client;
  const baseSlug = toSlug(rawTitle) || "annonce";

  for (let attempt = 1; attempt <= 8; attempt++) {
    const slug = attempt === 1 ? baseSlug : `${baseSlug.slice(0, 54)}-${attempt}`;
    const { data, error } = await supabase
      .from(ADS_TABLE)
      .insert({ ...stored, slug })
      .select("*")
      .maybeSingle();

    if (!error && data) {
      const ad = toPublicAd(rowToAd(data as ListingRow));
      // Decided from `base`, not `stored`: the copy-across in withoutTranslation
      // fills both columns, so testing `stored` would always report "nothing to
      // translate" and the background step would never run.
      scheduleTranslation(client, data as ListingRow, base);
      return ad;
    }

    const isDuplicate = Boolean(
      error && /duplicate key|already exists/i.test(error.message)
    );
    if (attempt < 8 && isDuplicate) continue;

    console.error("[ads] addAd failed:", error?.message);
    throw new Error(isDuplicate ? "SLUG_CONFLICT" : "DATABASE_ERROR");
  }

  throw new Error("DATABASE_ERROR");
}

export async function deleteAd(
  client: SupabaseClient,
  slug: string,
  actor: { id: string; accountType: AccountType }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = client;

  const { data: existing, error: findError } = await supabase
    .from(ADS_TABLE)
    .select("user_id")
    .eq("slug", slug)
    .maybeSingle();
  if (findError || !existing) {
    warnDbHint(findError, "deleteAd");
    return false;
  }

  if (existing.user_id !== actor.id && actor.accountType !== "admin") {
    throw new Error("FORBIDDEN");
  }

  const { error } = await supabase.from(ADS_TABLE).delete().eq("slug", slug);
  if (error) throw new Error("DATABASE_ERROR");
  return true;
}