import type { Metadata } from "next";
import { isLang, normalizeLang } from "@/lib/lang";
import { getDictionary } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SetLangDir from "@/components/SetLangDir";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = getDictionary(lang);
  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
  };
}

export async function generateStaticParams() {
  return [{ lang: "fr" }, { lang: "ar" }];
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const resolved: "fr" | "ar" = isLang(lang) ? lang : normalizeLang(lang);
  const dictionary = getDictionary(resolved);

  return (
    <>
      <SetLangDir lang={resolved} />
      <div className="flex min-h-screen flex-col">
        <Header lang={resolved} dictionary={dictionary} />
        <main className="flex-1">{children}</main>
        <Footer lang={resolved} dictionary={dictionary} />
      </div>
    </>
  );
}