import "server-only";

import { normalizeLang, type Lang } from "@/lib/lang";
import { dictionaries, type Dictionary } from "@/lib/dictionary";

export function getDictionary(langValue: string | undefined): Dictionary {
  const lang: Lang = normalizeLang(langValue);
  return dictionaries[lang];
}

export { normalizeLang };
export type { Lang, Dictionary };