import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { isLang, normalizeLang } from "@/lib/lang";
import PostAdForm from "@/components/forms/PostAdForm";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateStaticParams() {
  return [{ lang: "fr" }, { lang: "ar" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);
  return { title: `${dictionary.create.title} - Souk.dz` };
}

export default async function PostAdPage({ params }: PageProps) {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="grid mx-auto place-items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-3xl text-white shadow-lg shadow-emerald-600/20">
          +
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
          {dictionary.create.title}
        </h1>
        <p className="mt-1 text-sm text-emerald-700 font-semibold">
          {dictionary.create.subtitle}
        </p>
      </div>

      <PostAdForm lang={resolved} dictionary={dictionary} />
    </div>
  );
}