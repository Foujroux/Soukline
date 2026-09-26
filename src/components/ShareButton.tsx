"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Dictionary } from "@/lib/dictionary";

interface Props {
  lang: "fr" | "ar";
  dictionary: Dictionary;
  /** Absolute or root-relative URL. Defaults to the current page. */
  href?: string;
  title?: string;
  variant?: "button" | "icon";
  label?: string;
  className?: string;
}

// Resolved on click so the server-rendered markup stays identical on hydration.
function resolveUrl(href?: string): string {
  const current = window.location.href;
  if (!href) return current;
  if (/^https?:\/\//i.test(href)) return href;
  return window.location.origin + (href.startsWith("/") ? href : `/${href}`);
}

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path (insecure context, denied permission)
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export default function ShareButton({
  lang,
  dictionary,
  href,
  title,
  variant = "button",
  label,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Held in state so the target links are only built from a real URL, on demand.
  const [shareUrl, setShareUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const shareText = title ?? (lang === "fr" ? "Découvrez cette annonce sur Souk.dz" : "اكتشف هذا الإعلان على سوقدز");

  const handleShare = async () => {
    const url = resolveUrl(href);
    setShareUrl(url);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: shareText, url });
        return;
      } catch (error) {
        // A user-cancelled share must not fall through to the fallback sheet.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    setStatus("idle");
    setOpen(true);
  };

  const handleCopy = async () => {
    const ok = await writeToClipboard(shareUrl || resolveUrl(href));
    setStatus(ok ? "copied" : "failed");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2500);
  };

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${title ? `${title} - ` : ""}${shareUrl}`);

  const targets = [
    {
      key: "whatsapp",
      label: dictionary.share.whatsapp,
      href: `https://wa.me/?text=${encodedText}`,
      icon: <WhatsAppIcon className="h-4 w-4 text-green-500" />,
    },
    {
      key: "facebook",
      label: dictionary.share.facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <FacebookIcon className="h-4 w-4 text-blue-600" />,
    },
    {
      key: "x",
      label: dictionary.share.x,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(title ?? "")}`,
      icon: <XIcon className="h-4 w-4 text-slate-900" />,
    },
    {
      key: "telegram",
      label: dictionary.share.telegram,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      icon: <TelegramIcon className="h-4 w-4 text-sky-500" />,
    },
    {
      key: "email",
      label: dictionary.share.email,
      href: `mailto:?subject=${encodeURIComponent(title ?? shareText)}&body=${encodedText}`,
      icon: <EmailIcon className="h-4 w-4 text-slate-500" />,
    },
    {
      key: "sms",
      label: dictionary.share.sms,
      href: `sms:?body=${encodedText}`,
      icon: <SmsIcon className="h-4 w-4 text-teal-600" />,
    },
  ];

  const iconVariant = variant === "icon";
  const triggerLabel = label ?? dictionary.listing.share;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleShare}
        aria-label={iconVariant ? triggerLabel : undefined}
        aria-haspopup="dialog"
        className={
          iconVariant
            ? `grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur transition-colors hover:bg-emerald-600 hover:text-white hover:ring-emerald-600 ${className}`
            : `flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 ${className}`
        }
      >
        <ShareIcon />
        {!iconVariant && <span>{triggerLabel}</span>}
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={close}
              aria-hidden
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={triggerLabel}
              tabIndex={-1}
              className="relative w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-2xl outline-none sm:rounded-3xl"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-extrabold text-slate-900">
                  {dictionary.share.shareVia}
                </h3>
                <button
                  type="button"
                  onClick={close}
                  aria-label={dictionary.common.close}
                  className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {targets.map((target) => (
                  <a
                    key={target.key}
                    href={target.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 px-2 py-3 text-center transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-50">
                      {target.icon}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600">{target.label}</span>
                  </a>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
              >
                {status === "copied" ? <CheckIcon /> : <LinkIcon />}
                {status === "copied"
                  ? dictionary.share.copied
                  : status === "failed"
                    ? dictionary.share.copyFailed
                    : dictionary.share.copyLink}
              </button>

              <p aria-live="polite" className="sr-only">
                {status === "copied" ? dictionary.share.copied : ""}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function ShareIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}

function SmsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 17l4-1 5.5-5.5a2.12 2.12 0 00-3-3L8 13l-1 4zM14.5 5.5l4 4"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v10l-3 3h-3v3H7l-3-3V4z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.94 4.3 18.9 19.1c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.95.46l.34-4.8 8.73-7.89c.38-.34-.08-.53-.59-.19L6.98 13.1 2.3 11.7c-1.02-.32-1.04-1.02.21-1.5L20.6 2.8c.85-.31 1.59.2 1.34 1.5z" />
    </svg>
  );
}
