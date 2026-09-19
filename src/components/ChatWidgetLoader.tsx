"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/dictionary";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-2xl shadow-emerald-600/40"
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a8 8 0 01-8 8H5l-2 2V12a8 8 0 018-8h4a8 8 0 018 8h-2" />
      </svg>
    </div>
  ),
});

export default function ChatWidgetLoader({
  lang,
  dictionary,
}: {
  lang: "fr" | "ar";
  dictionary: Dictionary;
}) {
  return <ChatWidget lang={lang} dictionary={dictionary} />;
}