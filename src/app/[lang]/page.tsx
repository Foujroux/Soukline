import { isLang, normalizeLang } from "@/lib/lang";
import { getDictionary } from "@/lib/i18n";
import { CATEGORIES } from "@/data/categories";
import { getFeaturedListings, LISTINGS } from "@/data/listings";
import { ListingGrid } from "@/components/ListingCard";
import { WILAYAS } from "@/data/wilayas";
import HomeLatest from "@/components/HomeLatest";
import HomeFilters from "@/components/HomeFilters";
import { HomeFiltersProvider } from "@/components/HomeFiltersProvider";

export const metadata = {
  title: "Souk.dz",
};

export async function generateStaticParams() {
  return [{ lang: "fr" }, { lang: "ar" }];
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);
  const featured = getFeaturedListings();

  return (
    <HomeFiltersProvider>
      <div>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-10 rtl:scale-x-[-1]">
            <svg className="h-full w-full" viewBox="0 0 800 400" preserveAspectRatio="none">
              <path
                d="M0,100 C150,200 250,0 400,100 C550,200 650,50 800,150 L800,400 L0,400 Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-24">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
                <span aria-hidden>🇩🇿</span> {dictionary.hero.badge}
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
                {dictionary.hero.title}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-emerald-50/90">
                {dictionary.hero.subtitle}
              </p>
              <HeroSearch lang={resolved} dictionary={dictionary} />
              <HomeFilters lang={resolved} dictionary={dictionary} />
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-50/80">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                {dictionary.hero.adsCount}
              </p>
            </div>
          </div>
        </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {dictionary.hero.categoriesTitle}
            </h2>
          </div>
          <a
            href={`/${resolved}/categorie/tous`}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {dictionary.hero.viewAll} →
          </a>
        </div>
        <CategoryGrid lang={resolved} dictionary={dictionary} />
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {dictionary.hero.featuredTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {dictionary.hero.featuredSubtitle}
            </p>
          </div>
        </div>
        <ListingGrid
          listings={featured}
          lang={resolved}
          dictionary={dictionary}
        />
      </section>

      {/* Latest ads */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {dictionary.hero.recentTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {dictionary.hero.recentSubtitle}
            </p>
          </div>
        </div>
        <HomeLatest
          lang={resolved}
          dictionary={dictionary}
          staticListings={LISTINGS}
        />
      </section>

      {/* Wilayas strip */}
      <section className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-4 text-center text-xl font-extrabold text-slate-900">
            {resolved === "fr" ? "Partout en Algérie" : "في جميع أنحاء الجزائر"}
          </h2>
          <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
            {WILAYAS.slice(0, 16).map((w) => (
              <a
                key={w.code}
                href={`/${resolved}/recherche?w=${w.code}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {resolved === "fr" ? w.fr : w.ar}
              </a>
            ))}
          </div>
        </div>
      </section>
      </div>
    </HomeFiltersProvider>
  );
}

function CategoryGrid({
  lang,
  dictionary,
}: {
  lang: "fr" | "ar";
  dictionary: any;
}) {
  void dictionary;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {CATEGORIES.map((cat) => (
        <a
          key={cat.slug}
          href={`/${lang}/categorie/${cat.slug}`}
          className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 text-3xl transition-transform group-hover:scale-110">
            <span aria-hidden>{cat.emoji}</span>
          </span>
          <span className="text-sm font-bold text-slate-800">
            {lang === "fr" ? cat.fr : cat.ar}
          </span>
          <span className="line-clamp-2 text-xs leading-snug text-slate-500">
            {lang === "fr" ? cat.descriptionFr : cat.descriptionAr}
          </span>
        </a>
      ))}
    </div>
  );
}

function HeroSearch({
  lang,
  dictionary,
}: {
  lang: string;
  dictionary: any;
}) {
  return (
    <form
      action={`/${lang}/recherche`}
      method="GET"
      className="mt-7 flex max-w-2xl flex-col gap-2 sm:flex-row"
    >
      <div className="flex flex-1 items-center overflow-hidden rounded-xl bg-white shadow-2xl shadow-emerald-900/20">
        <span className="pl-3.5 text-slate-400" aria-hidden>
          <SearchIcon />
        </span>
        <input
          type="search"
          name="q"
          placeholder={dictionary.hero.searchPlaceholder}
          className="h-13 w-full bg-transparent px-3 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none"
          aria-label={dictionary.hero.searchPlaceholder}
        />
      </div>
      <select
        name="w"
        className="h-13 rounded-xl bg-white px-3 py-3.5 text-slate-600 shadow-2xl shadow-emerald-900/20 focus:outline-none"
        defaultValue=""
        aria-label={dictionary.hero.locationPlaceholder}
      >
        <option value="">{dictionary.hero.locationPlaceholder}</option>
        {WILAYAS.map((w) => (
          <option key={w.code} value={w.code}>
            {lang === "fr" ? w.fr : w.ar}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-13 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-extrabold text-amber-950 shadow-2xl shadow-amber-900/30 transition-colors hover:bg-amber-400"
      >
        {dictionary.hero.searchButton}
      </button>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  );
}