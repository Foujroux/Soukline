"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getThreads, addThreadMessage, type Thread } from "@/lib/userAds";
import type { Dictionary } from "@/lib/dictionary";
import { formatRelative } from "./MessagesList";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  id: string;
}

export default function ThreadView({ lang, dictionary, id }: Props) {
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(null);
  const [reply, setReply] = useState("");
  const [_, setTick] = useState(0);

  useEffect(() => {
    const t = getThreads().find((x) => x.id === id);
    if (t) setThread(t);
  }, [id, _]);

  const handleSend = () => {
    if (!reply.trim()) return;
    addThreadMessage(id, reply, true);
    // Simulate seller reply after a short delay
    setTimeout(() => {
      addThreadMessage(id, simulateReply(lang), false);
      setTick((v) => v + 1);
    }, 800);
    setReply("");
    setTick((v) => v + 1);
  };

  if (!thread) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="text-4xl">🔍</div>
        <p className="mt-3 font-semibold text-slate-700">
          {dictionary.ad.noResults}
        </p>
        <button
          type="button"
          onClick={() => router.push(`/${lang}/messages`)}
          className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          {dictionary.common.back}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
        <button
          type="button"
          onClick={() => router.push(`/${lang}/messages`)}
          aria-label={dictionary.common.back}
          className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <svg className="h-5 w-5 ltr:rotate-0 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-sm font-bold text-white">
          {thread.sellerName.charAt(0)}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-slate-900">
            {thread.listingTitle}
          </h2>
          <p className="text-xs text-slate-500">
            {thread.sellerName}
          </p>
        </div>
        <a
          href={`/${lang}/annonce/${thread.listingSlug}`}
          className="ml-auto shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-700"
        >
          {lang === "fr" ? "Voir l'annonce" : "عرض الإعلان"}
        </a>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ minHeight: 300, maxHeight: 500 }}>
        {thread.messages.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            {lang === "fr" ? "Commencez la conversation..." : "ابدأ المحادثة..."}
          </p>
        )}
        {thread.messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.fromMe
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              <p
                className={`mt-1 text-[10px] ${
                  m.fromMe ? "text-emerald-200" : "text-slate-400"
                }`}
              >
                {formatRelative(m.at, lang)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 px-5 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              lang === "fr"
                ? "Écrivez votre message..."
                : "اكتب رسالتك..."
            }
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!reply.trim()}
            className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {lang === "fr" ? "Envoyer" : "إرسال"}
          </button>
        </div>
      </div>
    </div>
  );
}

function simulateReply(lang: "fr" | "ar"): string {
  const fr = [
    "Merci pour votre message, je reviens vers vous très vite !",
    "Oui, c'est toujours disponible. Quand souhaitez-vous passer ?",
    "Le prix est négociable, contactez-moi directement.",
    "D'accord, je vous envoie les détails par WhatsApp.",
  ];
  const ar = [
    "شكرًا لرسالتك، سأرد عليك قريبًا!",
    "نعم، لا يزال متاحًا. متى تريد أن تمر؟",
    "السعر قابل للتفاوض، تواصل معي مباشرة.",
    "حسنًا، سأرسل لك التفاصيل عبر واتساب.",
  ];
  const options = lang === "ar" ? ar : fr;
  return options[Math.floor(Math.random() * options.length)];
}