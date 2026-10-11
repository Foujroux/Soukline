"use client";

import { useEffect, useState } from "react";

interface MailThread {
  id: string;
  subject: string;
  sender_email: string;
  sender_name: string;
  message_count: number;
  last_message_at: string;
}

interface MailMessage {
  id: string;
  from_email: string;
  from_name: string;
  body_text: string;
  created_at: string;
}

function formatDate(value: string, lang: "fr" | "ar"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(lang === "ar" ? "ar-DZ" : "fr-DZ", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * Read-only view of the mail AgentMail delivers to the shared inbox. It only
 * lists and opens messages: replies are handed to the admin's own mail client
 * via mailto, so nothing here can send mail on the site's behalf.
 */
export default function AdminMail({ lang }: { lang: "fr" | "ar" }) {
  const [threads, setThreads] = useState<MailThread[]>([]);
  const [selected, setSelected] = useState<MailThread | null>(null);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/mail");
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (data?.threads) setThreads(data.threads);
        else setError(data?.error ?? "ERROR");
      } catch {
        if (!cancelled) setError("NETWORK");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openThread = async (thread: MailThread) => {
    setSelected(thread);
    setOpening(true);
    setMessages([]);
    setError("");
    try {
      const res = await fetch(`/api/admin/mail?thread=${encodeURIComponent(thread.id)}`);
      const data = await res.json().catch(() => null);
      if (data?.messages) setMessages(data.messages);
      else setError(data?.error ?? "ERROR");
    } catch {
      setError("NETWORK");
    } finally {
      setOpening(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-slate-500">
        {lang === "fr" ? "Chargement…" : "جار التحميل…"}
      </p>
    );
  }

  const replyHref = selected
    ? `mailto:${selected.sender_email}?subject=${encodeURIComponent(
        selected.subject ? `Re: ${selected.subject}` : ""
      )}`
    : "";

  return (
    <div className="space-y-3">
      <h2 className="mb-3 text-lg font-bold text-slate-900">
        {lang === "fr" ? "Boîte mail" : "صندوق البريد"} ({threads.length})
      </h2>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="text-4xl">📭</div>
          <p className="mt-3 font-semibold text-slate-700">
            {lang === "fr"
              ? "Aucun message reçu pour le moment."
              : "لا توجد رسائل واردة حاليًا."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => openThread(t)}
              className={`flex w-full flex-col gap-1 rounded-2xl border p-4 text-left transition-colors ${
                selected?.id === t.id
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-emerald-200"
              }`}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 flex-1 truncate font-bold text-slate-900">
                  {t.subject || `(sans objet)`}
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {formatDate(t.last_message_at, lang)}
                </span>
              </div>
              <p className="truncate text-xs text-slate-500">
                {t.sender_name || t.sender_email}
                {t.sender_name && t.sender_email ? ` · ${t.sender_email}` : ""}
                {t.message_count > 1 ? ` · ${t.message_count}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="min-w-0 flex-1 truncate font-bold text-slate-900">
              {selected.subject || `(sans objet)`}
            </h3>
            <a
              href={replyHref}
              className="shrink-0 rounded-xl border border-emerald-200 px-4 py-2 text-center text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              {lang === "fr" ? "Répondre" : "رد"}
            </a>
          </div>

          {opening ? (
            <p className="mt-4 text-sm text-slate-500">
              {lang === "fr" ? "Chargement…" : "جار التحميل…"}
            </p>
          ) : messages.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              {lang === "fr" ? "Aucun message." : "لا توجد رسائل."}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {messages.map((m) => (
                <article
                  key={m.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="text-xs font-semibold text-slate-600">
                    {m.from_name || m.from_email}
                    {m.from_name && m.from_email ? ` · ${m.from_email}` : ""}
                    <span className="ml-2 font-normal text-slate-400">
                      {formatDate(m.created_at, lang)}
                    </span>
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800">
                    {m.body_text || (lang === "fr" ? "(sans corps)" : "(بدون نص)")}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}