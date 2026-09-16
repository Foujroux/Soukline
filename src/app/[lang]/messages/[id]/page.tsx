import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { isLang, normalizeLang } from "@/lib/lang";
import ThreadView from "@/components/forms/ThreadView";

type PageProps = { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);
  return { title: `${dictionary.dashboard.messages} - Souk.dz` };
}

export default async function ThreadPage({ params }: PageProps) {
  const { lang, id } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);
  void notFound;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ThreadView lang={resolved} dictionary={dictionary} id={id} />
    </div>
  );
}