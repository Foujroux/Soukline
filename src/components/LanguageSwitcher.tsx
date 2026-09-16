"use client";

import { usePathname } from "next/navigation";
import { LANGS, LANG_META } from "@/lib/lang";

export default function LanguageSwitcher() {
  const pathname = usePathname();

  const switchTo = (target: string) => {
    const path = pathname || "/";
    const parts = path.replace(/^\/+/, "").split("/");
    if (parts[0] === "fr" || parts[0] === "ar") {
      parts[0] = target;
    } else {
      parts.unshift(target);
    }
    window.location.href = "/" + parts.join("/");
  };

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm"
      role="group"
      aria-label="Language"
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
            pathname?.startsWith(`/${l}`) || (!pathname?.startsWith("/fr") && !pathname?.startsWith("/ar") && l === "fr")
              ? "bg-emerald-600 text-white shadow"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {LANG_META[l].nativeLabel}
        </button>
      ))}
    </div>
  );
}