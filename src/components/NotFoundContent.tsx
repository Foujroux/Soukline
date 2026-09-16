"use client";

import { usePathname } from "next/navigation";

export default function NotFoundContent() {
  const pathname = usePathname();
  const isAr = pathname?.startsWith("/ar");
  const lang = isAr ? "ar" : "fr";

  const title = isAr ? "الصفحة غير موجودة" : "Page introuvable";
  const text = isAr
    ? "الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
    : "La page que vous recherchez n'existe pas ou a été déplacée.";
  const homeLabel = isAr ? "العودة إلى الرئيسية" : "Retour à l'accueil";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="text-7xl" aria-hidden>
        🔍
      </span>
      <h1 className="mt-4 text-4xl font-extrabold text-slate-900">{title}</h1>
      <p className="mt-2 max-w-md text-slate-500">{text}</p>
      <a
        href={`/${lang}`}
        className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-700"
      >
        {homeLabel}
      </a>
    </div>
  );
}