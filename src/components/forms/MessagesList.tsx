"use client";

import { useEffect, useState } from "react";
import { getThreads, type Thread } from "@/lib/userAds";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
}

export default function MessagesList({ lang, dictionary }: Props) {
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    const load = () => setThreads(getThreads());
    load();
    window.addEventListener("soukdz:threads", load);
    return () => window.removeEventListener("soukdz:threads", load);
  }, []);

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="text-4xl">💬</div>
        <p className="mt-3 font-semibold text-slate-700">
          {lang === "fr"
            ? "Aucune conversation pour le moment."
            : "لا توجد محادثات في الوقت الحالي."}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {lang === "fr"
            ? "Contactez un vendeur depuis une annonce pour démarrer une discussion."
            : "تواصل مع بائع من خلال إعلان لبدء محادثة."}
        </p>
      </div>
    );
  }

  const sorted = [...threads].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="space-y-2">
      {sorted.map((thread) => {
        const last = thread.messages[thread.messages.length - 1];
        return (
          <a
            key={thread.id}
            href={`/${lang}/messages/${thread.id}`}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-lg text-white">
              {thread.sellerName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-bold text-slate-900">
                  {thread.listingTitle}
                </h3>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatRelative(last.at, lang)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                <span className="font-semibold text-slate-600">
                  {thread.sellerName} ·{" "}
                </span>
                {last?.text}
              </p>
            </div>
            <span className="text-slate-300 ltr:rotate-0 rtl:rotate-180" aria-hidden>
              ›
            </span>
          </a>
        );
      })}
    </div>
  );
}

export function formatRelative(date: string, lang: "fr" | "ar"): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 1) return lang === "fr" ? "à l'instant" : "الآن";
  if (diff < 60) return lang === "fr" ? `il y a ${diff} min` : `قبل ${diff} دقيقة`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return lang === "fr" ? `il y a ${hours} h` : `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return lang === "fr" ? `il y a ${days} j` : `قبل ${days} يوم`;
}