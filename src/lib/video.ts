/**
 * Video links on listings.
 *
 * Sellers attach a YouTube or Vimeo link instead of uploading a file. The app
 * has no file storage at all: photos are inlined as base64 data URLs inside the
 * `listings` row, and a video would either be rejected by the request size
 * limit or bloat every read of the row.
 *
 * The link is never rendered as given. A seller-supplied string ends up in an
 * iframe `src`, so a hostile link could point anywhere. Only the two supported
 * hosts are accepted, the video id is pulled out of it, and the embed URL is
 * rebuilt from that id — the seller cannot choose the URL that is embedded.
 */

/** The two providers whose links a seller may post. */
export type VideoProvider = "youtube" | "vimeo";

export interface VideoRef {
  provider: VideoProvider;
  id: string;
}

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const YOUTUBE_SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"]);

const VIMEO_HOSTS = new Set([
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
]);

/** YouTube ids are 11 characters today; the range leaves room for the future. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;

/** Vimeo ids are numeric. */
const VIMEO_ID = /^[0-9]{5,12}$/;

/** A pasted link is not trusted to be a URL yet, so the shape is checked first. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Extracts the video id out of a pasted link.
 *
 * Accepts the shapes sellers actually paste: the watch page, the short
 * youtu.be link, shorts, live, the embed URL itself, and both Vimeo forms.
 * Returns null for anything else, including a lookalike host such as
 * `youtube.com.example.net`.
 */
export function parseVideoUrl(value: unknown): VideoRef | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 500) return null;

  // Sellers paste links without the scheme often enough to be worth handling.
  const candidate = HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (YOUTUBE_SHORT_HOSTS.has(host)) {
    const id = segments[0] ?? "";
    return YOUTUBE_ID.test(id) ? { provider: "youtube", id } : null;
  }

  if (YOUTUBE_HOSTS.has(host)) {
    if (segments[0] === "watch") {
      const id = url.searchParams.get("v") ?? "";
      return YOUTUBE_ID.test(id) ? { provider: "youtube", id } : null;
    }
    if (segments[0] && ["shorts", "live", "embed", "v"].includes(segments[0])) {
      const id = segments[1] ?? "";
      return YOUTUBE_ID.test(id) ? { provider: "youtube", id } : null;
    }
    return null;
  }

  if (VIMEO_HOSTS.has(host)) {
    // player.vimeo.com/video/123 and vimeo.com/123 both mean the same clip.
    const id = segments[0] === "video" ? (segments[1] ?? "") : (segments[0] ?? "");
    return VIMEO_ID.test(id) ? { provider: "vimeo", id } : null;
  }

  return null;
}

/**
 * The canonical public link for a video, or an empty string when the input is
 * not a supported video link.
 *
 * This is what gets stored: a normalised link, so the same clip pasted in two
 * different shapes ends up as one row value.
 */
export function sanitizeVideoUrl(value: unknown): string {
  const ref = parseVideoUrl(value);
  if (!ref) return "";
  return ref.provider === "youtube"
    ? `https://www.youtube.com/watch?v=${ref.id}`
    : `https://vimeo.com/${ref.id}`;
}

/**
 * The URL to embed for a stored video link, or null when there is nothing to
 * embed. The host is fixed here, never taken from the seller's link.
 */
export function videoEmbedUrl(value: unknown): string | null {
  const ref = parseVideoUrl(value);
  if (!ref) return null;
  return ref.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${ref.id}`
    : `https://player.vimeo.com/video/${ref.id}`;
}

/** True when a listing carries a link that can actually be embedded. */
export function hasVideo(value: unknown): boolean {
  return videoEmbedUrl(value) !== null;
}
