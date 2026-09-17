import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { SearchBar, SearchBarMobile } from "@/components/SearchBar";
import PostAdButton from "@/components/PostAdButton";
import UserMenu from "@/components/UserMenu";
import { CATEGORIES } from "@/data/categories";
import type { Dictionary } from "@/lib/dictionary";

export default function Header({
  lang,
  dictionary,
}: {
  lang: "fr" | "ar";
  dictionary: Dictionary;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo lang={lang} dictionary={dictionary} />
            <nav className="hidden items-center gap-1 lg:flex">
              <LanguageSwitcher />
            </nav>
          </div>

          <div className="hidden flex-1 max-w-xl lg:block">
            <SearchBar lang={lang} dictionary={dictionary} />
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <div className="hidden lg:block">
              <PostAdButton
                lang={lang}
                postAdLabel={dictionary.nav.postAd}
                registerLabel={dictionary.auth.createAccount}
              />
            </div>
            <UserMenu
              lang={lang}
              loginLabel={dictionary.nav.login}
              accountLabel={dictionary.nav.myAccount}
              logoutLabel={dictionary.nav.logout}
              myAdsLabel={dictionary.dashboard.myAds}
              messagesLabel={dictionary.dashboard.messages}
            />
          </div>
        </div>

        <div className="lg:hidden">
          <div className="mb-2">
            <PostAdButton
              lang={lang}
              postAdLabel={dictionary.nav.postAd}
              registerLabel={dictionary.auth.createAccount}
              fullWidth
            />
          </div>
          <SearchBarMobile lang={lang} dictionary={dictionary} />
        </div>

        <div className="hidden gap-1 border-t border-slate-100 py-2 md:flex md:overflow-x-auto">
          {CATEGORIES.slice(0, 8).map((cat) => (
            <a
              key={cat.slug}
              href={`/${lang}/categorie/${cat.slug}`}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              <span aria-hidden>{cat.emoji}</span>
              {lang === "fr" ? cat.fr : cat.ar}
            </a>
          ))}
          <a
            href={`/${lang}/categorie/tous`}
            className="ml-auto shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            {dictionary.nav.allCategories}
          </a>
        </div>
      </div>
    </header>
  );
}

