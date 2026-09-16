"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, getListingBySlug } from "@/data/listings";
import { getCategory } from "@/data/categories";
import { getWilaya } from "@/data/wilayas";
import {
  clearProfile,
  getMyAds,
  getProfile,
  getSavedIds,
  removeMyAd,
} from "@/lib/userAds";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
}

type TabKey = "overview" | "ads" | "saved" | "settings";

export default function Dashboard({ lang, dictionary }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");
  const [vote, setVote] = useState(0);

  const profile = getProfile();
  const myAds = getMyAds();
  const savedIds = getSavedIds();
  const savedListings = savedIds
    .map((id) => getListingBySlug(id) ?? getMyAds().find((a) => a.id === id))
    .filter(Boolean);

  useEffect(() => {
    setVote((v) => v + 1);
  }, []);

  const threads = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("soukdz_threads") || "[]") as any[];
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vote, tab]);

  if (!profile) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="text-4xl">🔐</div>
        <h1 className="mt-3 text-xl font-extrabold text-slate-800">
          {dictionary.dashboard.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {lang === "fr"
            ? "Connectez-vous pour accéder à votre compte."
            : "سجّل الدخول للوصول إلى حسابك."}
        </p>
        <a
          href={`/${lang}/connexion`}
          className="mt-5 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          {dictionary.nav.login}
        </a>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: string; count?: number }[] = [
    { key: "overview", label: dictionary.dashboard.statisticTitle, icon: "📊" },
    { key: "ads", label: dictionary.dashboard.myAds, icon: "📢", count: myAds.length },
    { key: "saved", label: dictionary.dashboard.saved, icon: "🔖", count: savedListings.length },
    { key: "settings", label: dictionary.dashboard.settings, icon: "⚙️" },
  ];

  const totalViews = myAds.reduce((acc, a) => acc + a.views, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {dictionary.dashboard.welcome}, {profile.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearProfile();
            router.push(`/${lang}`);
          }}
          className="flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogoutIcon />
          {dictionary.nav.logout}
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-b-2 border-emerald-600 text-emerald-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span aria-hidden>{t.icon}</span>
            {t.label}
            {t.count != null && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <Overview
            lang={lang}
            myAds={myAds}
            totalViews={totalViews}
            threads={threads}
            dictionary={dictionary}
          />
        )}
        {tab === "ads" && (
          <MyAds
            lang={lang}
            myAds={myAds}
            dictionary={dictionary}
            onDelete={(id) => {
              removeMyAd(id);
              router.refresh();
              setVote((v) => v + 1);
            }}
          />
        )}
        {tab === "saved" && (
          <SavedAds lang={lang} saved={savedListings as any[]} dictionary={dictionary} />
        )}
        {tab === "settings" && (
          <Settings lang={lang} dictionary={dictionary} profile={profile} />
        )}
      </div>
    </div>
  );
}

function Overview({
  lang,
  myAds,
  totalViews,
  threads,
  dictionary,
}: {
  lang: "fr" | "ar";
  myAds: any[];
  totalViews: number;
  threads: any[];
  dictionary: Dictionary;
}) {
  const stats = [
    { label: dictionary.dashboard.totalAds, value: myAds.length, icon: "📢" },
    { label: dictionary.dashboard.totalViews, value: totalViews, icon: "👁️" },
    { label: dictionary.dashboard.messages, value: threads.length, icon: "💬" },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{s.label}</span>
              <span aria-hidden className="text-xl">{s.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <h3 className="text-lg font-extrabold text-emerald-800">
          {dictionary.dashboard.publishNew}
        </h3>
        <a
          href={`/${lang}/deposer`}
          className="mt-3 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-700"
        >
          + {lang === "fr" ? "Déposer une annonce" : "انشر إعلانًا"}
        </a>
      </div>
    </div>
  );
}

function MyAds({
  lang,
  myAds,
  dictionary,
  onDelete,
}: {
  lang: "fr" | "ar";
  myAds: any[];
  dictionary: Dictionary;
  onDelete: (id: string) => void;
}) {
  if (myAds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="text-4xl">📭</div>
        <p className="mt-3 font-semibold text-slate-700">{dictionary.dashboard.noAds}</p>
        <a
          href={`/${lang}/deposer`}
          className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          + {dictionary.dashboard.publishNew}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {myAds.map((ad) => {
        const cat = getCategory(ad.categorySlug);
        const wilaya = getWilaya(ad.wilayaCode);
        const title = lang === "fr" ? ad.titleFr : ad.titleAr || ad.titleFr;
        return (
          <div
            key={ad.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
          >
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-3xl">
              {ad.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ad.images[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{cat?.emoji ?? "📦"}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-bold text-slate-900" title={title}>{title}</h3>
              <p className="mt-0.5 text-sm font-semibold text-emerald-700">
                {formatPrice(ad.price, lang)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {cat ? (lang === "fr" ? cat.fr : cat.ar) : ""}
                {wilaya ? ` · ${lang === "fr" ? wilaya.fr : wilaya.ar}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => onDelete(ad.id)}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                {dictionary.ad.delete}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SavedAds({ lang, saved, dictionary }: { lang: "fr" | "ar"; saved: any[]; dictionary: Dictionary }) {
  if (saved.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="text-4xl">🔖</div>
        <p className="mt-3 font-semibold text-slate-700">
          {lang === "fr" ? "Aucune annonce enregistrée." : "لا توجد إعلانات محفوظة."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {saved.map((ad) => {
        const cat = getCategory(ad.categorySlug);
        const wilaya = getWilaya(ad.wilayaCode);
        const title = lang === "fr" ? ad.titleFr : (ad.titleAr || ad.titleFr);
        const slug = ad.slug ?? ad.id;
        return (
          <a
            key={ad.id ?? slug}
            href={`/${lang}/annonce/${slug}`}
            className="group flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
          >
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-2xl">
              {ad.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ad.images[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{cat?.emoji ?? "📦"}</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-emerald-700">{title}</h3>
              <p className="mt-1 text-sm font-extrabold text-emerald-700">{formatPrice(ad.price, lang)}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {wilaya ? (lang === "fr" ? wilaya.fr : wilaya.ar) : ""}
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function Settings({
  lang,
  dictionary,
  profile,
}: {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  profile: { name: string; email: string; phone: string };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500">{dictionary.auth.name}</h3>
        <p className="mt-1 text-slate-900">{profile.name}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500">{dictionary.auth.email}</h3>
        <p className="mt-1 text-slate-900">{profile.email}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500">{dictionary.auth.phone}</h3>
        <p className="mt-1 text-slate-900">{profile.phone || "—"}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500">{dictionary.dashboard.lastLogin}</h3>
        <p className="mt-1 text-slate-900">{new Date().toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-DZ")}</p>
      </div>
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}