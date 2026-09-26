"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, type Listing } from "@/data/listings";
import { getCategory } from "@/data/categories";
import { getWilaya } from "@/data/wilayas";
import {
  deleteMyAd,
  fetchMyAds,
  fetchSavedAds,
} from "@/lib/userAds";
import { accountTypeLabel, clearProfile, getProfile } from "@/lib/client-auth";
import type { SessionUser } from "@/lib/auth-types";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path (insecure context, denied permission)
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

type TabKey = "overview" | "ads" | "saved" | "share" | "moderation" | "settings";

export default function Dashboard({ lang, dictionary }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");
  const [vote, setVote] = useState(0);
  const [profile, setProfile] = useState<SessionUser | null | undefined>(undefined);
  const [myAds, setMyAds] = useState<Listing[]>([]);
  const [savedAds, setSavedAds] = useState<Listing[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchSavedAds().then((ads) => {
      if (!cancelled) setSavedAds(ads as unknown as Listing[]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setVote((v) => v + 1);
  }, []);

  useEffect(() => {
    const load = () => {
      getProfile().then(setProfile);
    };
    load();
    window.addEventListener("soukdz:auth", load);
    return () => window.removeEventListener("soukdz:auth", load);
  }, []);

  useEffect(() => {
    if (!profile) {
      setMyAds([]);
      return;
    }
    let cancelled = false;
    fetchMyAds().then((ads) => {
      if (!cancelled) setMyAds(ads as unknown as Listing[]);
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const threads = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("soukdz_threads") || "[]") as any[];
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vote, tab]);

  if (profile === undefined) {
    return (
      <div className="grid place-items-center rounded-2xl border border-slate-200 bg-white p-12">
        <p className="text-sm text-slate-500">{dictionary.common.loading}</p>
      </div>
    );
  }

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
    { key: "saved", label: dictionary.dashboard.saved, icon: "🔖", count: savedAds.length },
    { key: "share", label: dictionary.share.shareApp, icon: "📤" },
    ...(profile.accountType === "admin"
      ? [{ key: "moderation" as TabKey, label: lang === "fr" ? "Modération" : "الإشراف", icon: "🛡️", count: myAds.length }]
      : []),
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
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            {profile.email}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                profile.accountType === "admin"
                  ? "bg-violet-100 text-violet-700"
                  : profile.accountType === "merchant"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {accountTypeLabel(profile.accountType, lang)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await clearProfile();
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
            onDelete={async (id) => {
              const ad = myAds.find((a) => a.id === id);
              if (!ad) return;
              try {
                await deleteMyAd(ad.slug);
                setMyAds((prev) => prev.filter((a) => a.id !== id));
              } catch {
                // keep the ad so the user can retry
              }
              setVote((v) => v + 1);
            }}
          />
        )}
        {tab === "saved" && (
          <SavedAds lang={lang} saved={savedAds as any[]} dictionary={dictionary} />
        )}
        {tab === "share" && <ShareApp lang={lang} dictionary={dictionary} />}
        {tab === "moderation" && profile.accountType === "admin" && (
          <ModerationAds
            lang={lang}
            myAds={myAds}
            dictionary={dictionary}
            onDelete={async (id) => {
              const ad = myAds.find((a) => a.id === id);
              if (!ad) return;
              try {
                await deleteMyAd(ad.slug);
                setMyAds((prev) => prev.filter((a) => a.id !== id));
              } catch {
                // keep the ad so the user can retry
              }
              setVote((v) => v + 1);
            }}
          />
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
                <img src={ad.images[0]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
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
                {ad.accountType === "merchant" && (
                  <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                    {lang === "fr" ? "Marchand" : "تاجر"}
                  </span>
                )}
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
                <img src={ad.images[0]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
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

function ShareApp({ lang, dictionary }: { lang: "fr" | "ar"; dictionary: Dictionary }) {
  // Resolved after mount so the server-rendered markup matches on hydration.
  const [url, setUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setUrl(window.location.origin);
    setCanNativeShare(typeof navigator.share === "function");
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const message = `${dictionary.share.appText} ${url}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedMessage = encodeURIComponent(message);

  const targets = [
    {
      key: "whatsapp",
      label: dictionary.share.whatsapp,
      href: `https://wa.me/?text=${encodedMessage}`,
      icon: <WhatsAppIcon className="h-5 w-5 text-green-500" />,
    },
    {
      key: "facebook",
      label: dictionary.share.facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <FacebookIcon className="h-5 w-5 text-blue-600" />,
    },
    {
      key: "telegram",
      label: dictionary.share.telegram,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
      icon: <TelegramIcon className="h-5 w-5 text-sky-500" />,
    },
    {
      key: "x",
      label: dictionary.share.x,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(dictionary.share.appText)}`,
      icon: <XIcon className="h-5 w-5 text-slate-900" />,
    },
    {
      key: "email",
      label: dictionary.share.email,
      href: `mailto:?subject=${encodeURIComponent(dictionary.share.appTitle)}&body=${encodedMessage}`,
      icon: <EmailIcon className="h-5 w-5 text-slate-500" />,
    },
    {
      key: "sms",
      label: dictionary.share.sms,
      href: `sms:?body=${encodedMessage}`,
      icon: <SmsIcon className="h-5 w-5 text-teal-600" />,
    },
  ];

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: dictionary.share.appTitle, text: message, url });
    } catch {
      // a cancelled share needs no feedback
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    setStatus(ok ? "copied" : "failed");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div aria-hidden className="text-4xl">📤</div>
        <h3 className="mt-3 text-lg font-extrabold text-emerald-800">
          {dictionary.share.appInviteTitle}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-emerald-700">
          {dictionary.share.appInviteText}
        </p>
        <p className="mt-3 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-emerald-700">
          {url || "—"}
        </p>
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-700"
          >
            <ShareIcon />
            {dictionary.share.shareApp}
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500">{dictionary.share.shareVia}</h3>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {targets.map((target) => (
            <a
              key={target.key}
              href={url ? target.href : undefined}
              aria-disabled={url ? undefined : true}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                if (!url) event.preventDefault();
              }}
              className={`flex flex-col items-center gap-2 rounded-2xl border border-slate-100 px-2 py-4 text-center transition-colors hover:border-emerald-200 hover:bg-emerald-50 ${
                url ? "" : "pointer-events-none opacity-50"
              }`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-50">
                {target.icon}
              </span>
              <span className="text-[11px] font-semibold text-slate-600">{target.label}</span>
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!url}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {status === "copied" ? <CheckIcon /> : <LinkIcon />}
          {status === "copied"
            ? dictionary.share.copied
            : status === "failed"
              ? dictionary.share.copyFailed
              : dictionary.share.copyLink}
        </button>

        <p aria-live="polite" className="sr-only">
          {status === "copied" ? dictionary.share.copied : ""}
        </p>
      </div>
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
  profile: SessionUser;
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
        <h3 className="text-sm font-bold text-slate-500">
          {lang === "fr" ? "Type de compte" : "نوع الحساب"}
        </h3>
        <p className="mt-1 text-slate-900">{accountTypeLabel(profile.accountType, lang)}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500">{dictionary.dashboard.lastLogin}</h3>
        <p className="mt-1 text-slate-900">{new Date().toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-DZ")}</p>
      </div>
    </div>
  );
}

function ModerationAds({
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
        <div className="text-4xl">🛡️</div>
        <p className="mt-3 font-semibold text-slate-700">
          {lang === "fr" ? "Aucune annonce à modérer." : "لا توجد إعلانات للإشراف عليها."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="rounded-xl bg-violet-50 px-4 py-2.5 text-xs font-medium text-violet-700">
        {lang === "fr"
          ? "Espace modération : supprimez les annonces non conformes publiées sur cet appareil."
          : "مساحة الإشراف: احذف الإعلانات المخالفة المنشورة على هذا الجهاز."}
      </p>
      {myAds.map((ad) => {
        const cat = getCategory(ad.categorySlug);
        const title = lang === "fr" ? ad.titleFr : ad.titleAr || ad.titleFr;
        return (
          <div
            key={ad.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
          >
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-2xl">
              {ad.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ad.images[0]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <span>{cat?.emoji ?? "📦"}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-bold text-slate-900">{title}</h3>
              <p className="mt-0.5 text-sm font-semibold text-emerald-700">{formatPrice(ad.price, lang)}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {ad.sellerFr || ad.sellerAr} · {ad.email}
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

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function SmsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 17l4-1 5.5-5.5a2.12 2.12 0 00-3-3L8 13l-1 4zM14.5 5.5l4 4"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v10l-3 3h-3v3H7l-3-3V4z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.94 4.3 18.9 19.1c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.95.46l.34-4.8 8.73-7.89c.38-.34-.08-.53-.59-.19L6.98 13.1 2.3 11.7c-1.02-.32-1.04-1.02.21-1.5L20.6 2.8c.85-.31 1.59.2 1.34 1.5z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}
