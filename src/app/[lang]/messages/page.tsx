import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { isLang, normalizeLang } from "@/lib/lang";
import MessagesList from "@/components/forms/MessagesList";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateStaticParams() {
  return [{ lang: "fr" }, { lang: "ar" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);
  return { title: `${dictionary.dashboard.messages} - Souk.dz` };
}

export default async function MessagesPage({ params }: PageProps) {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900">
        {dictionary.dashboard.messages}
      </h1>
      <MessagesList lang={resolved} dictionary={dictionary} />
    </div>
  );
}