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
  return { title: "FAQ - Souk.dz" };
}

const FAQS: { fr: { q: string; a: string }; ar: { q: string; a: string } }[] = [
  {
    fr: { q: "Comment m'inscrire et publier mes articles ?", a: "Créez un compte avec vos coordonnées (nom, téléphone, wilaya), complétez votre profil, puis utilisez « Déposer une annonce » pour ajouter vos articles avec photo, description et prix." },
    ar: { q: "كيف أسجل وأضيف بضاعتي؟", a: "أنشئ حساباً بمعلوماتك (الاسم، الهاتف، الولاية)، أكمل ملفك الشخصي، ثم استخدم \"نشر إعلان\" لإضافة بضائعك مع الصورة والوصف والسعر." },
  },
  {
    fr: { q: "Comment fonctionne la plateforme ?", a: "Les vendeurs publient des annonces, les acheteurs les consultent et contactent directement les vendeurs pour convenir de l'état des biens et du prix. Le paiement se fait uniquement à la livraison." },
    ar: { q: "كيف يعمل التطبيق؟", a: "ينشر البائعون الإعلانات ويتصفحها المشترون ويتواصلون مباشرة مع البائعين للاتفاق على حالة السلع والسعر. يتم الدفع فقط عند الاستلام." },
  },
  {
    fr: { q: "Quelles sont les conditions d'utilisation ?", a: "L'utilisation de Souk.dz est soumise à nos Conditions d'utilisation. En vous inscrivant ou en publiant une annonce, vous acceptez ces conditions." },
    ar: { q: "ما هي الشروط والأحكام؟", a: "يخضع استخدام سوقدز لشروط الاستخدام. وبالتسجيل أو نشر إعلان، فإنك توافق على هذه الشروط." },
  },
  {
    fr: { q: "Quels articles sont autorisés ?", a: "Seuls les articles légaux sont autorisés. Tout article interdit est rejeté et, le cas échéant, les autorités compétentes seront contactées." },
    ar: { q: "ما هي السلع المسموح بها؟", a: "يُسمح فقط بالسلع القانونية. تُرفض أي سلع ممنوعة، وعند الاقتضاء يتم إبلاغ السلطات المختصة." },
  },
  {
    fr: { q: "Les administrateurs sont-ils responsables ?", a: "Les administrateurs de l'application ne peuvent être tenus responsables d'aucune activité illégale commise par les utilisateurs." },
    ar: { q: "هل يتحمل المدراء المسؤولية؟", a: "لا يتحمل مدراء التطبيق المسؤولية عن أي أنشطة غير قانونية يقوم بها المستخدمون." },
  },
];

export default async function FaqPage({ params }: PageProps) {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: dictionary.nav.home, href: `/${resolved}` },
          { label: "FAQ", href: `/${resolved}/faq` },
        ]}
      />
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">FAQ</h1>
      <div className="mt-6 space-y-4">
        {FAQS.map((f, i) => (
          <details key={i} className="rounded-lg border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer font-bold text-slate-800">
              {resolved === "fr" ? f.fr.q : f.ar.q}
            </summary>
            <p className="mt-2 leading-relaxed text-slate-600">
              {resolved === "fr" ? f.fr.a : f.ar.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
