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
    title: `${resolved === "fr" ? "Politique de confidentialité" : "سياسة الخصوصية"} - Souk.dz`,
  };
}

const SECTIONS: { fr: { title: string; body: string }; ar: { title: string; body: string } }[] = [
  {
    fr: { title: "1. Données collectées", body: "Nous collectons uniquement les données nécessaires au fonctionnement du service : compte, annonces, messages et informations techniques." },
    ar: { title: "1. البيانات المجمعة", body: "نجمع فقط البيانات اللازمة لتشغيل الخدمة: الحساب، الإعلانات، الرسائل والمعلومات التقنية." },
  },
  {
    fr: { title: "2. Exportation et suppression", body: "Vous pouvez à tout moment exporter ou supprimer vos données personnelles depuis votre compte." },
    ar: { title: "2. تصدير البيانات وحذفها", body: "يمكنك في أي وقت تصدير بياناتك الشخصية أو حذفها من حسابك." },
  },
  {
    fr: { title: "3. Cookies et traceurs", body: "Les traceurs publicitaires sont bloqués avant votre consentement via la bannière de cookies, qui propose toujours une option de refus." },
    ar: { title: "3. ملفات تعريف الارتباط والمتتبعات", body: "يتم حظر المتتبعات الإعلانية قبل موافقتك عبر لافتة ملفات تعريف الارتباط، والتي توفر دائماً خيار الرفض." },
  },
  {
    fr: { title: "4. Intelligence artificielle", body: "Vos données ne sont pas utilisées pour entraîner des modèles d'IA, sauf consentement explicite de votre part." },
    ar: { title: "4. الذكاء الاصطناعي", body: "لا تُستخدم بياناتك لتدريب نماذج الذكاء الاصطناعي إلا بموافقة صريحة منك." },
  },
  {
    fr: { title: "5. Sous-traitants", body: "La liste de nos sous-traitants est publiée et tenue à jour sur cette page." },
    ar: { title: "5. المتعاقدون الفرعيون", body: "تُنشر قائمة متعاقدينا الفرعيين ويتم تحديثها على هذه الصفحة." },
  },
  {
    fr: { title: "6. Contenus licenciés", body: "Toutes les images et polices utilisées sur Souk.dz sont correctement licenciées." },
    ar: { title: "6. المحتوى المرخص", body: "جميع الصور والخطوط المستخدمة في سوقدز مرخصة بشكل صحيح." },
  },
  {
    fr: { title: "7. Communications", body: "Chaque e-mail que nous envoyons contient un lien « Se désabonner » fonctionnel." },
    ar: { title: "7. الاتصالات", body: "تتضمن كل رسالة إلكترونية نرسلها رابط \"إلغاء الاشتراك\" يعمل بشكل صحيح." },
  },
];

export default async function PrivacyPage({ params }: PageProps) {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: dictionary.nav.home, href: `/${resolved}` },
          { label: resolved === "fr" ? "Politique de confidentialité" : "سياسة الخصوصية", href: `/${resolved}/confidentialite` },
        ]}
      />
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
        {resolved === "fr" ? "Politique de confidentialité" : "سياسة الخصوصية"}
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
