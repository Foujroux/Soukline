"use client";

import { useEffect } from "react";
import type { Lang } from "@/lib/lang";
import { LANG_META } from "@/lib/lang";

export default function SetLangDir({ lang }: { lang: Lang }) {
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = LANG_META[lang].dir;
  }, [lang]);
  return null;
}