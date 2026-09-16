import { CATEGORIES } from "@/data/categories";
import type { Dictionary } from "@/lib/dictionary";

export default function Footer({
  lang,
  dictionary,
}: {
  lang: "fr" | "ar";
  dictionary: Dictionary;
}) {
  const popular = CATEGORIES.slice(0, 6);

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <a href={`/${lang}`} className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-lg font-black text-white">
                س
              </span>
              <span className="text-xl font-extrabold text-white">
                Souk<span className="text-emerald-400">.dz</span>
              </span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              {dictionary.footer.aboutText}
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              {dictionary.footer.categories}
            </h3>
            <ul className="space-y-2">
              {popular.map((cat) => (
                <li key={cat.slug}>
                  <a
                    href={`/${lang}/categorie/${cat.slug}`}
                    className="text-sm text-slate-400 transition-colors hover:text-emerald-400"
                  >
                    {lang === "fr" ? cat.fr : cat.ar}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              {dictionary.footer.help}
            </h3>
            <ul className="space-y-2">
              {dictionary.footer.helpLinks.map((link) => (
                <li key={link}>
                  <a
                    href={`/${lang}`}
                    className="text-sm text-slate-400 transition-colors hover:text-emerald-400"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              {dictionary.footer.newsletter}
            </h3>
            <p className="mb-3 text-sm text-slate-400">
              {dictionary.footer.aboutText.split(".")[0]}.
            </p>
<form
                action={`/${lang}`}
                method="GET"
                className="flex overflow-hidden rounded-lg bg-slate-800 focus-within:ring-2 focus-within:ring-emerald-500"
              >
              <input
                type="email"
                required
                placeholder={dictionary.footer.emailPlaceholder}
                className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
              >
                {dictionary.footer.subscribe}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Souk.dz. {dictionary.footer.rights}
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-emerald-500">❤</span>
            {dictionary.footer.madeIn}
          </p>
        </div>
      </div>
    </footer>
  );
}