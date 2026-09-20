"use client";

import { useState } from "react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  lang: "fr" | "ar";
  placeholder?: React.ReactNode;
}

export default function ImageCarousel({
  images,
  alt,
  lang,
  placeholder,
}: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const count = images.length;

  const labels =
    lang === "ar"
      ? {
          gallery: "معرض الصور",
          prev: "الصورة السابقة",
          next: "الصورة التالية",
          thumbnails: "الصور المصغرة",
          image: "صورة",
        }
      : {
          gallery: "Galerie d'images",
          prev: "Image précédente",
          next: "Image suivante",
          thumbnails: "Miniatures",
          image: "Image",
        };

  if (count === 0) {
    return (
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-700">
        {placeholder}
      </div>
    );
  }

  const safeIndex = current % count;
  const goPrev = () => setCurrent((c) => (c - 1 + count) % count);
  const goNext = () => setCurrent((c) => (c + 1) % count);

  return (
    <div role="group" aria-roledescription="carousel" aria-label={labels.gallery}>
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={safeIndex}
          src={images[safeIndex]}
          alt={alt}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <span className="absolute bottom-3 ltr:right-3 rtl:left-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-bold text-white">
          {safeIndex + 1} / {count}
        </span>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label={labels.prev}
              className="absolute top-1/2 ltr:left-3 rtl:right-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-800 shadow transition-colors hover:bg-white"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={labels.next}
              className="absolute top-1/2 ltr:right-3 rtl:left-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-800 shadow transition-colors hover:bg-white"
            >
              <ChevronRightIcon />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`${labels.image} ${i + 1}`}
              aria-pressed={i === safeIndex}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === safeIndex
                  ? "border-emerald-600"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}