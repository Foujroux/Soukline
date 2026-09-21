import type { Metadata } from "next";
import { formatPrice, getSimilarListings } from "@/data/listings";
import { getAdBySlug, listPublicAds, toPublicAd } from "@/lib/server-ads";
import { getCategory } from "@/data/categories";
import { getWilaya } from "@/data/wilayas";
import { getDictionary } from "@/lib/i18n";
import { isLang, normalizeLang } from "@/lib/lang";
import { ListingGrid } from "@/components/ListingCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import UserAdDetail from "@/components/UserAdDetail";
import AdDetailClient from "./AdDetailClient";
import ImageCarousel from "@/components/ImageCarousel";

type PageProps = {
  params: Promise<{ lang: string; slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const ad = await getAdBySlug(slug);
  if (!ad) return { title: "Not found" };
  const listing = toPublicAd(ad);
  const title = resolved === "fr" ? listing.titleFr : listing.titleAr;
  return {
    title: `${title} - Souk.dz`,
    description: resolved === "fr" ? listing.descriptionFr : listing.descriptionAr,
  };
}

export default async function AdDetailPage({ params }: PageProps) {
  const { lang, slug } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);
  const [ad, all] = await Promise.all([getAdBySlug(slug), listPublicAds()]);
  if (!ad) {
    return <UserAdDetail lang={resolved} dictionary={dictionary} slug={slug} />;
  }
  const listing = toPublicAd(ad);

  const category = getCategory(listing.categorySlug);
  const wilaya = getWilaya(listing.wilayaCode);
  const similar = getSimilarListings(all, listing, 4);
  const title = resolved === "fr" ? listing.titleFr : listing.titleAr;
  const description = resolved === "fr" ? listing.descriptionFr : listing.descriptionAr;
  const condition =
    resolved === "fr" ? listing.conditionFr : listing.conditionAr;
  const commune = resolved === "fr" ? listing.communeFr : listing.communeAr;
  const locationText = wilaya
    ? `${commune}, ${resolved === "fr" ? wilaya.fr : wilaya.ar}`
    : commune;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: dictionary.nav.home, href: `/${resolved}` },
          {
            label: category ? (resolved === "fr" ? category.fr : category.ar) : "",
            href: `/${resolved}/categorie/${listing.categorySlug}`,
          },
          { label: title },
        ]}
      />

      <div className="mt-4 flex flex-col gap-6 xl:flex-row">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="relative">
              <ImageCarousel
                images={listing.images}
                alt={title}
                lang={resolved}
                placeholder={
                  <>
                    <span className="text-8xl opacity-90">{category?.emoji ?? "📦"}</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </>
                }
              />
              {listing.featured && (
                <span className="absolute top-3 ltr:left-3 rtl:right-3 z-10 rounded-full bg-amber-400/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-950 shadow">
                  ★ {resolved === "fr" ? "Annonce à la une" : "إعلان مميز"}
                </span>
              )}
            </div>
          </div>

          {/* Title & price */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h1 className="text-2xl font-extrabold leading-snug text-slate-900 lg:text-3xl">
              {title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-extrabold text-emerald-700">
                {formatPrice(listing.price, resolved)}
              </span>
              {listing.negotiable && listing.price > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {dictionary.listing.negotiable}
                </span>
              )}
              {!listing.negotiable && listing.price > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {dictionary.listing.fixed}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <PinIcon />
                {locationText}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarIcon />
                {dictionary.listing.publishedOn}{" "}
                {formatDate(listing.createdAt, resolved)}
              </span>
              <span className="flex items-center gap-1.5">
                <EyeIcon />
                {new Intl.NumberFormat(resolved === "ar" ? "ar-DZ" : "fr-DZ").format(
                  listing.views
                )}{" "}
                {dictionary.listing.views}
              </span>
              {condition !== "-" && (
                <span className="flex items-center gap-1.5">
                  <TagIcon />
                  {dictionary.listing.condition}: {condition}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-lg font-extrabold text-slate-900">
              {dictionary.listing.description}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {description}
            </p>
          </div>

          {/* Actions */}
          <AdDetailClient
            lang={resolved}
            dictionary={dictionary}
            listing={listing}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full shrink-0 space-y-5 xl:w-80">
          {/* Seller card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-extrabold text-slate-900">
              {dictionary.listing.seller}
            </h3>

            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-sm font-bold text-white">
                {(resolved === "fr" ? listing.sellerFr : listing.sellerAr).charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  {resolved === "fr" ? listing.sellerFr : listing.sellerAr}
                </p>
                <p className="text-xs text-slate-500">{locationText}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <a
                href={`tel:${listing.phone}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-xl"
              >
                <PhoneIcon />
                {dictionary.listing.phone}
                <span className="ltr:ml-2 rtl:mr-2 font-medium">{listing.phone}</span>
              </a>

              <a
                href={`mailto:${listing.email}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
              >
                <EmailIcon />
                {dictionary.listing.email}
              </a>

              <a
                href={`https://wa.me/${listing.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/25 transition-all hover:bg-green-600"
              >
                <WhatsAppIcon />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Ad reference */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="text-xs font-semibold text-slate-500">
              {dictionary.listing.adId}
            </h4>
            <p className="mt-1 font-mono text-sm text-slate-700">
              SKDZ-{String(listing.id).padStart(6, "0")}
            </p>
          </div>
        </div>
      </div>

      {/* Similar ads */}
      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-extrabold text-slate-900">
            {dictionary.listing.similarAds}
          </h2>
          <ListingGrid listings={similar} lang={resolved} dictionary={dictionary} />
        </section>
      )}
    </div>
  );
}

function formatDate(date: string, lang: "fr" | "ar"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-DZ" : "fr-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}