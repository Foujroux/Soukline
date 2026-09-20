import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/server-auth";
import { addAd, listAds } from "@/lib/server-ads";
import { normalizeSearchText } from "@/data/listings";
import type { UserAd } from "@/lib/userAds";

export const runtime = "nodejs";

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function applyFilters(
  ads: UserAd[],
  searchParams: URLSearchParams
): UserAd[] {
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const wilaya = parseNumber(searchParams.get("w"));
  const min = parseNumber(searchParams.get("min"));
  const max = parseNumber(searchParams.get("max"));
  const neg = searchParams.get("neg") === "1";
  const normQ = q ? normalizeSearchText(q) : "";

  return ads.filter((l) => {
    if (category && category !== "tous" && l.categorySlug !== category)
      return false;
    if (wilaya != null && l.wilayaCode !== wilaya) return false;
    if (min != null && !Number.isNaN(min) && l.price < min) return false;
    if (max != null && !Number.isNaN(max) && l.price > max) return false;
    if (neg && !l.negotiable) return false;
    if (normQ) {
      const haystack = normalizeSearchText(
        `${l.titleFr} ${l.titleAr} ${l.descriptionFr} ${l.descriptionAr} ${l.communeFr} ${l.communeAr} ${l.sellerFr} ${l.sellerAr}`
      );
      if (!haystack.includes(normQ)) return false;
    }
    return true;
  });
}

export async function GET(request: NextRequest) {
  const ads = await listAds();
  const publicAds = applyFilters(
    ads.map(({ ownerId: _ownerId, ...pub }) => pub),
    request.nextUrl.searchParams
  );
  return NextResponse.json({ ads: publicAds });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const data = body as Partial<UserAd> | null;
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  const title = (data.titleFr || data.titleAr || "").toString().trim();
  if (!title) {
    return NextResponse.json({ error: "TITLE_REQUIRED" }, { status: 400 });
  }

  try {
    const ad = await addAd({
      ownerId: user.id,
      accountType: user.accountType,
      data: {
        categorySlug: data.categorySlug ?? "",
        titleFr: data.titleFr ?? "",
        titleAr: data.titleAr ?? "",
        descriptionFr: data.descriptionFr ?? "",
        descriptionAr: data.descriptionAr ?? "",
        price: data.price ?? 0,
        currency: "DA",
        wilayaCode: data.wilayaCode ?? 0,
        communeFr: data.communeFr ?? "",
        communeAr: data.communeAr ?? "",
        conditionFr: data.conditionFr ?? "",
        conditionAr: data.conditionAr ?? "",
        sellerFr: data.sellerFr ?? "",
        sellerAr: data.sellerAr ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        negotiable: Boolean(data.negotiable),
        images: Array.isArray(data.images) ? data.images : [],
      },
    });
    return NextResponse.json({ ad }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "INTERNAL_ERROR";
    if (message === "TITLE_REQUIRED") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}