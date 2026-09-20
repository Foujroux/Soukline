"use client";

import { useEffect, useState } from "react";
import { fetchAdBySlug } from "@/lib/userAds";
import { formatPrice, type Listing } from "@/data/listings";
import { getCategory } from "@/data/categories";
import { getWilaya } from "@/data/wilayas";
import type { Dictionary } from "@/lib/dictionary";
import NotFoundContent from "@/components/NotFoundContent";
import AdDetailClient from "@/app/[lang]/annonce/[slug]/AdDetailClient";
import ImageCarousel from "@/components/ImageCarousel";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  slug: string;
}

export default function UserAdDetail({ lang, dictionary, slug }: Props) {
  const [ad, setAd] = useState<Listing | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAdBySlug(slug).then((found) => {
      if (cancelled) return;
      setAd((found as Listing) ?? null);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!loaded) return null;

  if (!ad) return <NotFoundContent />;

  const category = getCategory(ad.categorySlug);
  const wilaya = getWilaya(ad.wilayaCode);
  const title = lang === "fr" ? ad.titleFr : ad.titleAr || ad.titleFr;
  const description = lang === "fr" ? ad.descriptionFr : ad.descriptionAr || ad.descriptionFr;
  const condition = lang === "fr" ? ad.conditionFr : ad.conditionAr;
  const commune = lang === "fr" ? ad.communeFr : ad.communeAr;
  const locationText = wilaya
    ? `${commune}, ${lang === "fr" ? wilaya.fr : wilaya.ar}`
    : commune;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mt-4 flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <ImageCarousel
              images={ad.images}
              alt={title}
              lang={lang}
              placeholder={
                <span className="text-8xl opacity-90">{category?.emoji ?? "📦"}</span>
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h1 className="text-2xl font-extrabold leading-snug text-slate-900 lg:text-3xl">
              {title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-extrabold text-emerald-700">
                {formatPrice(ad.price, lang)}
              </span>
              {ad.negotiable && ad.price > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {dictionary.listing.negotiable}
                </span>
              )}
              {!ad.negotiable && ad.price > 0 && (
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
                {formatDate(ad.createdAt, lang)}
              </span>
              <span className="flex items-center gap-1.5">
                <EyeIcon />
                {new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : "fr-DZ").format(ad.views)}{" "}
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-lg font-extrabold text-slate-900">
              {dictionary.listing.description}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {description}
            </p>
          </div>

          <AdDetailClient lang={lang} dictionary={dictionary} listing={ad} />
        </div>

        <div className="w-full shrink-0 space-y-5 xl:w-80">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-extrabold text-slate-900">
              {dictionary.listing.seller}
            </h3>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-sm font-bold text-white">
                {(lang === "fr" ? ad.sellerFr : ad.sellerAr).charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  {lang === "fr" ? ad.sellerFr : ad.sellerAr}
                </p>
                <p className="text-xs text-slate-500">{locationText}</p>
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              <a
                href={`tel:${ad.phone}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-xl"
              >
                <PhoneIcon />
                {dictionary.listing.phone}
                <span className="ltr:ml-2 rtl:mr-2 font-medium">{ad.phone}</span>
              </a>
              <a
                href={`mailto:${ad.email}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
              >
                <EmailIcon />
                {dictionary.listing.email}
              </a>
              <a
                href={`https://wa.me/${ad.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/25 transition-all hover:bg-green-600"
              >
                <WhatsAppIcon />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
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