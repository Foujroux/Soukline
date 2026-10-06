"use client";

import { useEffect, useState } from "react";

interface AdminAd {
  id: string;
  slug: string;
  titleFr: string;
  titleAr: string;
  email: string;
  images: string[];
  price: number;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  account_type: string;
  banned: boolean;
  created_at: string;
}

export default function AdminPanel({ lang }: { lang: "fr" | "ar" }) {
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const [a, u] = await Promise.all([
        fetch("/api/admin/ads").then((r) => r.json()),
        fetch("/api/admin/users").then((r) => r.json()),
      ]);
      setAds(a.ads ?? []);
      setUsers(u.users ?? []);
      if (a.error || u.error) setError(a.error ?? u.error);
    } catch {
      setError("NETWORK");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const moderate = async (payload: object) => {
    const res = await fetch("/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setError(d?.error ?? "ERROR");
    }
    await reload();
  };

  if (loading) {
    return <p className="text-sm text-slate-500">{lang === "fr" ? "Chargement…" : "جار التحميل…"}</p>;
  }

  return (
    <div className="space-y-8">
      {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">{error}</p>}

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          {lang === "fr" ? "Utilisateurs" : "المستخدمون"} ({users.length})
        </h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{u.full_name || u.email}</p>
                <p className="truncate text-xs text-slate-500">{u.email} · {u.account_type}</p>
              </div>
              <div className="flex items-center gap-2">
                {u.banned && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    {lang === "fr" ? "SUSPENDU" : "موقوف"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => moderate({ action: "set_banned", userId: u.id, banned: !u.banned })}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    u.banned
                      ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      : "border-red-200 text-red-600 hover:bg-red-50"
                  }`}
                >
                  {u.banned
                    ? lang === "fr" ? "Réactiver" : "إعادة التفعيل"
                    : lang === "fr" ? "Suspendre" : "إيقاف"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          {lang === "fr" ? "Annonces" : "الإعلانات"} ({ads.length})
        </h2>
        <div className="space-y-2">
          {ads.map((ad) => (
            <div key={ad.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <h3 className="min-w-0 flex-1 truncate font-bold text-slate-900">
                  {lang === "fr" ? ad.titleFr : ad.titleAr || ad.titleFr}
                </h3>
                <p className="truncate text-xs text-slate-500">{ad.email}</p>
                <button
                  type="button"
                  onClick={() => moderate({ action: "delete_ad", slug: ad.slug })}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  {lang === "fr" ? "Supprimer l'annonce" : "حذف الإعلان"}
                </button>
              </div>
              {ad.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ad.images.map((img: string, i: number) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-16 w-16 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => moderate({ action: "delete_image", slug: ad.slug, image: img })}
                        className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white"
                        aria-label="delete image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
