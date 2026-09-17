import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, getCategory } from "@/data/categories";
import { getDictionary } from "@/lib/i18n";
import { isLang, normalizeLang } from "@/lib/lang";
import { searchListings, sortListings, type SortOrder } from "@/data/listings";
import SearchResults from "@/components/SearchResults";
import FilterSidebar from "@/components/layout/FilterSidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";

type PageProps = {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateStaticParams() {
  const slugs = ["tous", ...CATEGORIES.map((c) => c.slug)];
  return ["fr", "ar"].flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);
  const cat = getCategory(slug);
  const name = cat ? (resolved === "fr" ? cat.fr : cat.ar) : dictionary.categories.title;
  return {
    title: `${name} - Souk.dz`,
    description: dictionary.meta.description,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { lang, slug } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);

  const sp = await searchParams;
  const cat = slug !== "tous" ? getCategory(slug) : undefined;
  if (slug !== "tous" && !cat) notFound();

  const categoryName = cat ? (resolved === "fr" ? cat.fr : cat.ar) : dictionary.nav.allCategories;

  const w = sp.w ? Number(sp.w) : undefined;
  const min = sp.min ? Number(sp.min) : undefined;
  const max = sp.max ? Number(sp.max) : undefined;
  const sort = sp.sort ?? "newest";
  const neg = sp.neg === "1";

  const listings = sortListings(
    searchListings({
      categorySlug: slug,
      wilayaCode: w,
      minPrice: min,
      maxPrice: max,
      negotiableOnly: neg,
    }),
    sort as SortOrder
  );

  const basePath = `/${resolved}/categorie/${slug}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: dictionary.nav.home, href: `/${resolved}` },
          { label: cat ? (resolved === "fr" ? cat.fr : cat.ar) : dictionary.categories.title },
        ]}
      />

      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 lg:w-64 xl:w-72">
          <FilterSidebar
            lang={resolved}
            dictionary={dictionary}
            basePath={basePath}
            q={sp.q}
            cat={slug}
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
              <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
                <span aria-hidden>{cat?.emoji ?? "📦"}</span>
                {categoryName}
              </h1>
            </div>
          </div>

          <SearchResults
            lang={resolved}
            dictionary={dictionary}
            staticListings={listings}
            categorySlug={slug}
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