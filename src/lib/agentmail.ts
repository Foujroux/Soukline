import { createHmac, timingSafeEqual } from "node:crypto";
import type { InboundMessage } from "@/lib/server-mail";

// Svix tolerates +/- 5 minutes of clock skew before rejecting a signature.
// Widening it would widen the replay window, so keep it at the library default.
const SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * Verifies a Svix-signed AgentMail delivery.
 *
 * Kept out of the route file on purpose: a route module in Next 16 may only
 * export the HTTP verbs and a fixed set of config exports, so exporting this
 * helper from route.ts fails the build's type check.
 *
 * Svix signs `${svix-id}.${svix-timestamp}.${rawBody}` with HMAC-SHA256 keyed
 * by the base64 payload of the `whsec_...` secret, and sends the result as a
 * space-delimited list of `v1,<base64>` pairs (one per signature version, so
 * a key rotation can overlap).
 */
export function verifySvixSignature(
  rawBody: string,
  headers: Headers,
  secret: string
): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatureHeader = headers.get("svix-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return false;
  if (Math.abs(Date.now() / 1000 - sentAt) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  if (key.length === 0) return false;

  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  // Compare decoded bytes so an equivalent base64 encoding with different
  // padding cannot slip past, and use a constant-time compare.
  for (const part of signatureHeader.split(" ")) {
    const [version, signature] = part.split(",");
    if (version !== "v1" || !signature) continue;
    const provided = Buffer.from(signature, "base64");
    if (
      provided.length === expected.length &&
      timingSafeEqual(provided, expected)
    ) {
      return true;
    }
  }

  return false;
}

/** The subset of an AgentMail webhook envelope this app acts on. */
export interface AgentMailEvent {
  type?: string;
  event_type?: string;
  event_id?: string;
  message?: InboundMessage;
}