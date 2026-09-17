"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget({ lang, dictionary }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: dictionary.chat.greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading, open]);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) {
        throw new Error("chat failed");
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-2xl shadow-emerald-600/40 transition-all hover:scale-105 hover:brightness-110"
        aria-label={open ? dictionary.chat.close : dictionary.chat.open}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-400" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[480px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-700 to-teal-600 px-5 py-4 text-white">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-xl">
              🤖
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{dictionary.chat.title}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-emerald-100">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300" />
                {dictionary.chat.online}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
              aria-label={dictionary.chat.close}
            >
              <CloseIcon />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4"
          >
            <p className="mx-auto mb-1 w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-500">
              {dictionary.chat.subtitle}
            </p>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                      : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
                  <Dot className="animate-bounce [animation-delay:-0.3s]" />
                  <Dot className="animate-bounce [animation-delay:-0.15s]" />
                  <Dot className="animate-bounce" />
                </div>
              </div>
            )}
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
                {dictionary.chat.error}
              </p>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={dictionary.chat.placeholder}
              aria-label={dictionary.chat.placeholder}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              aria-label={dictionary.chat.send}
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Dot({ className }: { className?: string }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${className ?? ""}`}
    />
  );
}

function ChatIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a8 8 0 01-8 8H5l-2 2V12a8 8 0 018-8h4a8 8 0 018 8h-2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}