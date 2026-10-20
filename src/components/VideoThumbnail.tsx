"use client";

import { useState } from "react";

interface Props {
  /** Thumbnail URLs to try in order; the first one that loads is kept. */
  candidates: string[];
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}

/**
 * The picture of a video ad.
 *
 * A seller who attaches a video but no photo would otherwise show the
 * category placeholder, so the video's own thumbnail stands in for it. The
 * candidates are tried in order because YouTube only publishes the
 * high-resolution one for videos that have an HD version.
 */
export default function VideoThumbnail({
  candidates,
  alt,
  className,
  loading = "lazy",
  fetchPriority,
}: Props) {
  const [index, setIndex] = useState(0);
  const src = candidates[index];

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      onError={() => setIndex((i) => i + 1)}
      className={className}
    />
  );
}
