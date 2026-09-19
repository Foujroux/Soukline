import type { Lang } from "@/lib/lang";
import { LANG_META } from "@/lib/lang";

export default function SetLangDir({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <div lang={lang} dir={LANG_META[lang].dir}>
      {children}
    </div>
  );
}