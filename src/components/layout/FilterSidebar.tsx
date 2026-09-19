import { WILAYAS } from "@/data/wilayas";
import type { Dictionary } from "@/lib/dictionary";
import type { SortOrder } from "@/data/listings";

interface FilterSidebarProps {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  basePath: string;
  q?: string;
  cat?: string;
  w?: string;
  min?: string;
  max?: string;
  sort?: string;
  neg?: string;
}

export default function FilterSidebar({
  lang,
  dictionary,
  basePath,
  q = "",
  cat = "",
  w = "",
  min = "",
  max = "",
  sort = "newest",
  neg = "",
}: FilterSidebarProps) {
  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20">
      <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
        <FilterIcon />
        {dictionary.filters.title}
      </h2>

      <form method="GET" action={basePath} className="mt-4 space-y-4">
        {q ? <input type="hidden" name="q" value={q} /> : null}
        {cat ? <input type="hidden" name="cat" value={cat} /> : null}

        <div>
          <label
            htmlFor="w"
            className="mb-1.5 block text-xs font-semibold text-slate-600"
          >
            {dictionary.filters.wilaya}
          </label>
          <select
            id="w"
            name="w"
            defaultValue={w}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">{lang === "fr" ? "Toute l'Algérie" : "كل الجزائر"}</option>
            {WILAYAS.map((wilaya) => (
              <option key={wilaya.code} value={wilaya.code}>
                {wilaya.code} - {lang === "fr" ? wilaya.fr : wilaya.ar}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            {dictionary.filters.price} ({dictionary.common.francs})
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="min"
              inputMode="numeric"
              min="0"
              aria-label={dictionary.filters.minPrice}
              placeholder={dictionary.filters.minPrice}
              defaultValue={min}
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <span className="text-slate-400" aria-hidden>
              –
            </span>
            <input
              type="number"
              name="max"
              inputMode="numeric"
              min="0"
              aria-label={dictionary.filters.maxPrice}
              placeholder={dictionary.filters.maxPrice}
              defaultValue={max}
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="neg"
            value="1"
            defaultChecked={neg === "1"}
            className="h-4 w-4 rounded accent-emerald-600"
          />
          {dictionary.filters.negotiateOnly}
        </label>

        <div>
          <label
            htmlFor="sort"
            className="mb-1.5 block text-xs font-semibold text-slate-600"
          >
            {dictionary.filters.sortBy}
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort as SortOrder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="newest">{dictionary.filters.sortNewest}</option>
            <option value="oldest">{dictionary.filters.sortOldest}</option>
            <option value="price_asc">{dictionary.filters.sortPriceAsc}</option>
            <option value="price_desc">{dictionary.filters.sortPriceDesc}</option>
          </select>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            {dictionary.filters.apply}
          </button>
          <a
            href={basePath}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            {dictionary.filters.reset}
          </a>
        </div>
      </form>
    </aside>
  );
}

function FilterIcon() {
  return (
    <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
    </svg>
  );
}