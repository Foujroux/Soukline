// Algeria country code. Supabase phone auth (and every SMS gateway behind it)
// expects strict E.164, so a local "0550 12 34 56" has to become
// "+213550123456" before it reaches signInWithOtp.
const DZ = "213";

/**
 * Normalizes a user-typed phone number to E.164 for Algeria.
 *
 * Accepted inputs: "0550123456", "550123456", "213550123456",
 * "+213 550 12 34 56", "00213...", and numbers that keep punctuation.
 * Returns "" when the result is not a plausible E.164 number so callers can
 * reject it before spending an SMS.
 */
export function toAlgeriaE164(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Keep digits only, plus a single leading "+" if the user typed one.
  const hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");

  // "00213550123456" is the international-prefix form of "+213...".
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
    if (!digits) return "";
    return `+${digits}`;
  }
  if (!hasPlus && !digits) return "";

  // Strip the national prefix and re-add the country code.
  if (digits.startsWith(DZ)) {
    digits = digits.slice(DZ.length);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  } else if (hasPlus) {
    // A "+" that is not +213 is a number we cannot assume is ours.
    return "";
  }

  if (!digits) return "";
  // E.164 allows at most 15 digits; Algerian numbers are 8-9 national digits.
  if (digits.length < 8 || digits.length > 15) return "";

  return `+${DZ}${digits}`;
}
