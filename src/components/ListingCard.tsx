import Link from "next/link";
import type { Listing } from "@/data/listings";
import { formatPrice } from "@/data/listings";
import { getCategory } from "@/data/categories";
import { getWilaya } from "@/data/wilayas";

function PlaceholderImage({ cat, className }: { cat: string; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-700 ${className ?? ""}`}
    >
      <span className="text-6xl opacity-90">{getCategory(cat)?.emoji ?? "📦"}</span>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}

function relativeDate(date: string, lang: "fr" | "ar"): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (diff <= 0) return lang === "fr" ? "Aujourd'hui" : "اليوم";
  if (diff === 1) return lang === "fr" ? "Hier" : "أمس";
  if (diff < 30) return lang === "fr" ? `il y a ${diff} j` : `قبل ${diff} يوم`;
  const m = Math.floor(diff / 30);
  return lang === "fr" ? `il y a ${m} mois` : `قبل ${m} شهر`;
}

function formatViews(views: number, lang: "fr" | "ar"): string {
  const n = new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : "fr-DZ").format(views);
  return lang === "ar" ? `${n} مشاهدة` : `${n} vues`;
}

export function ListingCard({
  listing,
  lang,
  dictionary,
}: {
  listing: Listing;
  lang: "fr" | "ar";
  dictionary: any;
}) {
  const category = getCategory(listing.categorySlug);
  const wilaya = getWilaya(listing.wilayaCode);
  const title = lang === "fr" ? listing.titleFr : listing.titleAr;
  const categoryLabel = lang === "fr" ? category?.fr ?? "" : category?.ar ?? "";

  return (
    <Link
      href={`/${lang}/annonce/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {listing.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.images[0]}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <PlaceholderImage cat={listing.categorySlug} className="h-full w-full" />
        )}
        {listing.featured && (
          <span className="absolute top-2 ltr:left-2 rtl:right-2 rounded-full bg-amber-400/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow">
            ★ {lang === "fr" ? "À la une" : "مميز"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
          <span aria-hidden>{category?.emoji}</span>
          <span>{categoryLabel}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{lang === "fr" ? wilaya?.fr : wilaya?.ar}</span>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700">
          {title}
        </h3>

        <div className="mt-1 text-xs text-slate-500">
          {relativeDate(listing.createdAt, lang)}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-2.5">
          <div>
            <span className="text-lg font-extrabold text-emerald-700">
              {formatPrice(listing.price, lang)}
            </span>
            {!listing.negotiable && listing.price > 0 && (
              <span className="mt-0.5 block text-[10px] text-slate-400">
                {lang === "fr" ? "prix ferme" : "سعر ثابت"}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">{formatViews(listing.views, lang)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ListingGrid({
  listings,
  lang,
  dictionary,
}: {
  listings: Listing[];
  lang: "fr" | "ar";
  dictionary: any;
}) {
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="text-4xl">🔍</div>
        <p className="mt-3 font-semibold text-slate-700">
          {dictionary?.ad?.noResults ?? "Aucune annonce trouvée."}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {dictionary?.ad?.noResultsHint ?? "Essayez d'élargir votre recherche."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          lang={lang}
          dictionary={dictionary}
        />
      ))}
    </div>
  );
}