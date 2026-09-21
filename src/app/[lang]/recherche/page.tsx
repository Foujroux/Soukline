import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { isLang, normalizeLang } from "@/lib/lang";
import { searchListings, sortListings, type SortOrder } from "@/data/listings";
import { listPublicAds } from "@/lib/server-ads";
import SearchResults from "@/components/SearchResults";
import FilterSidebar from "@/components/layout/FilterSidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

type PageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateStaticParams() {
  return [{ lang: "fr" }, { lang: "ar" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);
  return {
    title: `${dictionary.filters.sortNewest} - Souk.dz`,
    description: dictionary.meta.description,
  };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);

  const sp = await searchParams;
  const w = sp.w ? Number(sp.w) : undefined;
  const min = sp.min ? Number(sp.min) : undefined;
  const max = sp.max ? Number(sp.max) : undefined;
  const sort = sp.sort ?? "newest";
  const neg = sp.neg === "1";

  const all = await listPublicAds();

  const listings = sortListings(
    searchListings(all, {
      query: sp.q,
      wilayaCode: w,
      minPrice: min,
      maxPrice: max,
      negotiableOnly: neg,
    }),
    sort as SortOrder
  );

  const basePath = `/${resolved}/recherche`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: dictionary.nav.home, href: `/${resolved}` },
          { label: resolved === "fr" ? "Recherche" : "بحث" },
        ]}
      />

      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 lg:w-64 xl:w-72">
          <FilterSidebar
            lang={resolved}
            dictionary={dictionary}
            basePath={basePath}
            q={sp.q}
            w={sp.w}
            min={sp.min}
            max={sp.max}
            sort={sp.sort}
            neg={sp.neg}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {sp.q
                  ? `${resolved === "fr" ? "Résultats pour" : "نتائج البحث عن"} "${sp.q}"`
                  : resolved === "fr"
                    ? "Toutes les annonces"
                    : "جميع الإعلانات"}
              </h1>
            </div>
          </div>

          <SearchResults
            lang={resolved}
            dictionary={dictionary}
            initialListings={listings}
            query={sp.q}
            wilayaCode={w}
            minPrice={min}
            maxPrice={max}
            negotiableOnly={neg}
            sort={sort as SortOrder}
          />
        </div>
      </div>
    </div>
  );
}