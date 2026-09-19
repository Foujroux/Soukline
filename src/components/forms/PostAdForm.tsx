"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/data/categories";
import { WILAYAS } from "@/data/wilayas";
import { addMyAd, conditionLabel, CONDITIONS, type UserAd } from "@/lib/userAds";
import { getCachedUser } from "@/lib/client-auth";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
}

export default function PostAdForm({ lang, dictionary }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || optimizing) return;
    setOptimizing(true);
    try {
      const additions: string[] = [];
      for (const file of Array.from(files)) {
        if (additions.length + images.length >= 8) break;
        const dataUrl = await compressImage(file);
        if (dataUrl) additions.push(dataUrl);
      }
      setImages((prev) => [...prev, ...additions]);
    } finally {
      setOptimizing(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);

    const id = crypto.randomUUID();
    const wilayaCode = Number(form.get("wilaya") || 16);
    const price = Number(form.get("price") || 0);
    const categorySlug = String(form.get("category") || "services");
    const conditionKey = String(form.get("condition") || "new");
    const negotiate = form.get("negotiable") === "on";
    const profile = getCachedUser();
    if (!profile) {
      router.push(`/${lang}/connexion`);
      return;
    }

    const slug = createSlug(String(form.get("title") || ""), id);

    const ad: UserAd = {
      id,
      slug,
      categorySlug,
      titleFr: lang === "fr" ? String(form.get("title")) : "",
      titleAr: lang === "ar" ? String(form.get("title")) : "",
      descriptionFr:
        lang === "fr" ? String(form.get("description")) : "",
      descriptionAr:
        lang === "ar" ? String(form.get("description")) : "",
      price,
      currency: "DA",
      wilayaCode,
      communeFr: lang === "fr" ? String(form.get("commune") || "") : "",
      communeAr: lang === "ar" ? String(form.get("commune") || "") : "",
      conditionFr: conditionLabel(conditionKey, "fr"),
      conditionAr: conditionLabel(conditionKey, "ar"),
      sellerFr: lang === "fr" ? String(form.get("name") || "") : "",
      sellerAr: lang === "ar" ? String(form.get("name") || "") : "",
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || profile?.email || ""),
      createdAt: new Date().toISOString(),
      views: 0,
      featured: false,
      negotiable: negotiate,
      accountType: profile.accountType,
      images,
    };

    addMyAd(ad);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => router.push(`/${lang}/compte?tab=ads`), 1200);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
        <div className="text-5xl">✅</div>
        <h2 className="mt-4 text-xl font-extrabold text-emerald-800">
          {dictionary.create.submitSuccess}
        </h2>
        <p className="mt-2 text-sm text-emerald-700">
          {lang === "fr"
            ? "Redirection vers votre tableau de bord..."
            : "جارٍ التحويل إلى لوحة التحكم..."}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {/* Basic info */}
      <section>
        <h3 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-slate-500">
          1. {lang === "fr" ? "Informations" : "المعلومات"}
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-slate-700">
              {dictionary.create.listingTitle} *
            </label>
            <input
              id="title"
              name="title"
              required
              maxLength={90}
              placeholder={dictionary.create.listingTitlePlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1.5 block text-sm font-semibold text-slate-700">
                {dictionary.create.category} *
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.emoji} {lang === "fr" ? cat.fr : cat.ar}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="condition" className="mb-1.5 block text-sm font-semibold text-slate-700">
                {dictionary.create.condition}
              </label>
              <select
                id="condition"
                name="condition"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {(Object.keys(CONDITIONS) as (keyof typeof CONDITIONS)[]).map((key) => (
                  <option key={key} value={key}>
                    {conditionLabel(key, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="mb-1.5 block text-sm font-semibold text-slate-700">
                {dictionary.create.price} ({dictionary.common.francs})
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min={0}
                required
                placeholder={dictionary.create.pricePlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <label className="flex items-end gap-2 self-end cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" name="negotiable" className="h-4 w-4 accent-emerald-600" />
              {dictionary.create.negotiate}
            </label>
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-slate-700">
              {dictionary.create.description} *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              placeholder={dictionary.create.descriptionPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </section>

      {/* Location */}
      <section>
        <h3 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-slate-500">
          2. {lang === "fr" ? "Localisation" : "الموقع"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wilaya" className="mb-1.5 block text-sm font-semibold text-slate-700">
              {dictionary.create.wilaya} *
            </label>
            <select
              id="wilaya"
              name="wilaya"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} - {lang === "fr" ? w.fr : w.ar}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="commune" className="mb-1.5 block text-sm font-semibold text-slate-700">
              {dictionary.create.commune} *
            </label>
            <input
              id="commune"
              name="commune"
              required
              placeholder={dictionary.create.communePlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </section>

      {/* Photos */}
      <section>
        <h3 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-slate-500">
          3. {dictionary.create.uploadPhotos}
        </h3>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={optimizing}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-slate-500 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 disabled:opacity-60"
        >
          {optimizing ? (
            <SpinnerIcon />
          ) : (
            <CameraIcon />
          )}
          <span className="text-sm font-semibold">
            {optimizing
              ? lang === "fr"
                ? "Optimisation des images..."
                : "جارٍ تحسين الصور..."
              : dictionary.create.uploadPhotos}
          </span>
          <span className="text-xs">{dictionary.create.uploadHint}</span>
        </button>
        {images.length > 0 && (
          <>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              {images.length} {dictionary.create.photoUploaded}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1 inset-x-0 mx-auto w-fit rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white">
                      {lang === "fr" ? "Principale" : "رئيسية"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label={lang === "ar" ? "حذف الصورة" : "Supprimer l'image"}
                    className="absolute top-1 ltr:right-1 rtl:left-1 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Contact */}
      <section>
        <h3 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-slate-500">
          4. {dictionary.create.yourContact}
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-slate-700">
              {dictionary.create.name} *
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
                {dictionary.create.phone} *
              </label>
              <input
                id="phone"
                name="phone"
                required
                placeholder={dictionary.create.phonePlaceholder}
                inputMode="tel"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                {dictionary.create.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-600/25 transition-all hover:brightness-110 disabled:opacity-60"
      >
        {submitting ? dictionary.common.loading : dictionary.create.submit}
      </button>
    </form>
  );
}

function createSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base || "annonce"}-${id.slice(0, 6)}`;
}

const supportsWebp = (() => {
  try {
    return (
      typeof document !== "undefined" &&
      document.createElement("canvas").toDataURL("image/webp", 0.1).startsWith("data:image/webp")
    );
  } catch {
    return false;
  }
})();

function compressImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_EDGE = 1200;
        let { width, height } = img;
        if (width > MAX_EDGE || height > MAX_EDGE) {
          const ratio = Math.min(MAX_EDGE / width, MAX_EDGE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, width, height);

        const pixels = width * height;
        const quality = pixels > 800 * 800 ? 0.72 : pixels > 400 * 400 ? 0.78 : 0.82;
        const type = supportsWebp ? "image/webp" : "image/jpeg";
        try {
          resolve(canvas.toDataURL(type, quality));
        } catch {
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        }
      };
      img.onerror = () => resolve(null);
      img.src = String(reader.result);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function CameraIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}