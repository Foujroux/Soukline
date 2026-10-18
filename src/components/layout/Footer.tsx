import { CATEGORIES } from "@/data/categories";
import type { Dictionary } from "@/lib/dictionary";

const TIKTOK_URL = "https://www.tiktok.com/@soukline.dz";
const YOUTUBE_URL = "https://www.youtube.com/@Soukdz";
const EMAIL = "soukdzenline@gmail.com";

function EmailIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v.86a.75.75 0 0 1-1.28.53L12 2.4 4.28 6.89A.75.75 0 0 1 3 6.36V5.5Zm0 3.24v9.76A1.5 1.5 0 0 0 4.5 20h15a1.5 1.5 0 0 0 1.5-1.5V8.74a.75.75 0 0 0-.28-.58L12 13.6 3.28 8.16a.75.75 0 0 0-.28.58Z" />
    </svg>
  );
}

function TikTokIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.04-2.82h-3.1v12.4a2.59 2.59 0 0 1-2.6 2.5 2.59 2.59 0 1 1 .77-5.06V9.7a5.68 5.68 0 0 0-.77-.05A5.62 5.62 0 0 0 4.1 15.2 5.62 5.62 0 0 0 9.72 20.8a5.62 5.62 0 0 0 5.62-5.6V9.01a7.35 7.35 0 0 0 4.28 1.37V7.28a4.28 4.28 0 0 1-3.02-1.46z" />
    </svg>
  );
}

function YouTubeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23.5 6.9a3.02 3.02 0 0 0-2.12-2.14C19.5 4.25 12 4.25 12 4.25s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.9C0 8.79 0 12 0 12s0 3.21.5 5.1a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.21 24 12 24 12s0-3.21-.5-5.1ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
    </svg>
  );
}

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
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <a href={`/${lang}`} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size 36px mark from /public; matches Logo.tsx. */}
              <img src="/logo.jpg" alt="Souk.dz" className="h-9 w-9 rounded-lg object-cover" />
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
              {dictionary.footer.helpLinks.map((link, i) => (
                <li key={link}>
                  <a
                    href={i === 0 ? `/${lang}/comment-ca-marche` : i === 3 ? `/${lang}/faq` : `/${lang}`}
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
              {dictionary.footer.legal}
            </h3>
            <ul className="space-y-2">
              {dictionary.footer.legalLinks.map((link, i) => (
                <li key={link}>
                  <a
                    href={`/${lang}/${["conditions", "confidentialite", "dpa"][i]}`}
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
                aria-label={dictionary.footer.emailPlaceholder}
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

        <div className="mt-10 flex flex-col items-start gap-4 rounded-xl border border-slate-800 bg-slate-800/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              {dictionary.footer.contact}
            </h3>
            <p className="mt-1.5 text-sm text-slate-400">
              {dictionary.footer.contactText}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <a
              href={`mailto:${EMAIL}`}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-slate-700 transition-colors hover:ring-emerald-500"
            >
              <EmailIcon />
              <span>{dictionary.footer.email}</span>
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-slate-700 transition-colors hover:ring-emerald-500"
            >
              <TikTokIcon />
              <span>{dictionary.footer.tiktok}</span>
              <span className="font-normal text-slate-400">
                {dictionary.footer.tiktokHandle}
              </span>
            </a>
            <a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-slate-700 transition-colors hover:ring-red-500"
            >
              <YouTubeIcon />
              <span>{dictionary.footer.youtube}</span>
              <span className="font-normal text-slate-400">
                {dictionary.footer.youtubeHandle}
              </span>
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Souk.dz. {dictionary.footer.rights}
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-emerald-500" aria-hidden>❤</span>
            {dictionary.footer.madeIn}
          </p>
        </div>
      </div>
    </footer>
  );
}