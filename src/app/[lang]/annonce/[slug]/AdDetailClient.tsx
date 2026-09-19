"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Listing } from "@/data/listings";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  listing: Listing;
}

export default function AdDetailClient({ lang, dictionary, listing }: Props) {
  const router = useRouter();
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    try {
      const key = "soukdz_saved";
      const current: string[] = JSON.parse(localStorage.getItem(key) || "[]");
      const updated = saved ? current.filter((id) => id !== listing.id) : [...current, listing.id];
      localStorage.setItem(key, JSON.stringify(updated));
      setSaved(!saved);
    } catch {
      // silently fail
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: lang === "fr" ? listing.titleFr : listing.titleAr,
          url,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const key = "soukdz_threads";
    const threads: Thread[] = JSON.parse(localStorage.getItem(key) || "[]");
    const now = new Date().toISOString();
    const existing = threads.find((t) => t.listingId === listing.id);
    if (existing) {
      existing.messages.push({ id: crypto.randomUUID(), fromMe: true, text: messageText, at: now });
      existing.updatedAt = now;
    } else {
      threads.push({
        id: crypto.randomUUID(),
        listingId: listing.id,
        listingSlug: listing.slug,
        listingTitle: lang === "fr" ? listing.titleFr : listing.titleAr,
        sellerName: lang === "fr" ? listing.sellerFr : listing.sellerAr,
        lang,
        messages: [{ id: crypto.randomUUID(), fromMe: true, text: messageText, at: now }],
        createdAt: now,
        updatedAt: now,
      });
    }
    localStorage.setItem(key, JSON.stringify(threads));
    setMessageText("");
    setShowMessageForm(false);
    router.push(`/${lang}/messages`);
  };

  return (
    <div className="space-y-4">
      {/* Message form */}
      {showMessageForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 text-lg font-extrabold text-slate-900">
            {lang === "fr" ? "Envoyer un message" : "إرسال رسالة"}
          </h3>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            aria-label={lang === "fr" ? "Message au vendeur" : "رسالتك إلى البائع"}
            placeholder={
              lang === "fr"
                ? "Écrivez votre message au vendeur..."
                : "اكتب رسالتك للبائع..."
            }
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleSendMessage}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
            >
              {lang === "fr" ? "Envoyer" : "إرسال"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMessageForm(false);
                setMessageText("");
              }}
              className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {dictionary.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {!showMessageForm && (
          <button
            type="button"
            onClick={() => setShowMessageForm(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <MessageIcon />
            {lang === "fr" ? "Envoyer un message" : "إرسال رسالة"}
          </button>
        )}

        <button
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors ${
            saved
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
          }`}
        >
          <BookmarkIcon filled={saved} />
          {saved ? dictionary.listing.saved : dictionary.listing.save}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
        >
          <ShareIcon />
          {dictionary.listing.share}
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
        >
          <ReportIcon />
          {dictionary.listing.report}
        </button>
      </div>
    </div>
  );
}

interface ThreadMessage {
  id: string;
  fromMe: boolean;
  text: string;
  at: string;
}

interface Thread {
  id: string;
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  sellerName: string;
  lang: string;
  messages: ThreadMessage[];
  createdAt: string;
  updatedAt: string;
}



function MessageIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}