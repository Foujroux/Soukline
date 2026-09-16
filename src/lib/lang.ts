export type Lang = "fr" | "ar";
export const LANGS: Lang[] = ["fr", "ar"];

export const LANG_META: Record<
  Lang,
  { dir: "ltr" | "rtl" | "auto"; label: string; nativeLabel: string }
> = {
  fr: { dir: "ltr", label: "Français", nativeLabel: "Français" },
  ar: { dir: "rtl", label: "العربية", nativeLabel: "العربية" },
};

export function isLang(value: string): value is Lang {
  return value === "fr" || value === "ar";
}

export const DEFAULT_LANG: Lang = "fr";

export function normalizeLang(value: string | undefined): Lang {
  if (value === undefined) return DEFAULT_LANG;
  return isLang(value) ? value : DEFAULT_LANG;
}