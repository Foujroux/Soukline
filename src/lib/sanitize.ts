export function sanitizeText(value: unknown, maxLength = 2000): string {
  if (typeof value !== "string") return "";
  let out = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u2028\u2029]/g, "\n")
    .trim();
  if (maxLength > 0 && out.length > maxLength) {
    out = out.slice(0, maxLength);
  }
  return out;
}

export function sanitizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[^0-9+ ()-]/g, "").trim().slice(0, 20);
}

export function sanitizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  const cleaned = value
    .replace(/[^a-zA-Z0-9.!#$%&'*+/=?^_`{|}~@-]/g, "")
    .trim()
    .slice(0, 120);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) ? cleaned : "";
}

export function sanitizeName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[<>&"'`]/g, "").trim().slice(0, 80);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}