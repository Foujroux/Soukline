import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { isLang, normalizeLang } from "@/lib/lang";
import { Breadcrumbs } from "@/components/Breadcrumbs";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateStaticParams() {
  return [{ lang: "fr" }, { lang: "ar" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  return {
    title: `${resolved === "fr" ? "Comment ça marche" : "كيف يعمل الموقع"} - Souk.dz`,
  };
}

const SECTIONS: { fr: { title: string; body: string }; ar: { title: string; body: string } }[] = [
  {
    fr: { title: "1. Le principe", body: "Souk.dz est une place de marché entre particuliers et professionnels. Les vendeurs publient leurs annonces ; les acheteurs les consultent et contactent directement les vendeurs." },
    ar: { title: "1. المبدأ", body: "سوقدز سوق إلكتروني بين الأفراد والمهنيين. ينشر البائعون إعلاناتهم ويتصفحها المشترون ويتواصلون مباشرة مع البائعين." },
  },
  {
    fr: { title: "2. Règles de la place de marché", body: "Les annonces doivent être réelles, conformes à la description et légales. Tout contenu frauduleux, interdit ou trompeur est supprimé. Le non-respect des règles peut entraîner la suspension du compte." },
    ar: { title: "2. قواعد السوق", body: "يجب أن تكون الإعلانات حقيقية ومطابقة للوصف وقانونية. تُحذف أي محتويات احتيالية أو ممنوعة أو مضللة، وقد يؤدي مخالفة القواعد إلى تعليق الحساب." },
  },
  {
    fr: { title: "3. Contact entre clients et vendeurs", body: "L'acheteur doit contacter le vendeur pour se mettre d'accord sur l'état des marchandises, le prix final ou les modalités d'échange. C'est à vous de vérifier l'état de l'article avant toute transaction." },
    ar: { title: "3. التواصل بين المشترين والبائعين", body: "يجب على المشتري التواصل مع البائع للاتفاق على حالة البضاعة والسعر النهائي أو شروط التبادل. يعود إليك التحقق من حالة السلعة قبل أي معاملة." },
  },
  {
    fr: { title: "4. Paiement à la livraison", body: "Le paiement s'effectue uniquement à la livraison de la marchandise. Aucun paiement à distance ou à l'avance n'est exigé." },
    ar: { title: "4. الدفع عند الاستلام", body: "يتم الدفع فقط عند استلام البضاعة. لا يُطلب أي دفع مسبق أو عن بُعد." },
  },
  {
    fr: { title: "5. Conditions générales", body: "L'utilisation de Souk.dz est soumise à nos Conditions d'utilisation. En publiant une annonce ou en concluant une transaction, vous acceptez ces conditions." },
    ar: { title: "5. الشروط والأحكام", body: "يخضع استخدام سوقدز لشروط الاستخدام الخاصة بنا. وبنشر إعلان أو إتمام معاملة، فإنك توافق على هذه الشروط." },
  },
];

export default async function HowItWorksPage({ params }: PageProps) {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: dictionary.nav.home, href: `/${resolved}` },
          { label: resolved === "fr" ? "Comment ça marche" : "كيف يعمل الموقع", href: `/${resolved}/comment-ca-marche` },
        ]}
      />
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
        {resolved === "fr" ? "Comment ça marche ?" : "كيف يعمل الموقع؟"}
      </h1>
      <div className="mt-6 space-y-6">
        {SECTIONS.map((s, i) => (
          <section key={i}>
            <h2 className="text-lg font-bold text-slate-800">{resolved === "fr" ? s.fr.title : s.ar.title}</h2>
            <p className="mt-2 leading-relaxed text-slate-600">{resolved === "fr" ? s.fr.body : s.ar.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
