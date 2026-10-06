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
    title: `${resolved === "fr" ? "Accord de traitement des données (DPA)" : "اتفاقية معالجة البيانات (DPA)"} - Souk.dz`,
  };
}

const SECTIONS: { fr: { title: string; body: string }; ar: { title: string; body: string } }[] = [
  {
    fr: { title: "1. Objet", body: "Cet accord régit le traitement des données personnelles effectué par Souk.dz pour le compte des utilisateurs professionnels (entreprises)." },
    ar: { title: "1. الغرض", body: "تحكم هذه الاتفاقية معالجة البيانات الشخصية التي تقوم بها سوقدز نيابة عن المستخدمين التجاريين (الشركات)." },
  },
  {
    fr: { title: "2. Sous-traitants", body: "La liste des sous-traitants est publiée et vérifiable. Souk.dz notifie les utilisateurs professionnels de tout changement important." },
    ar: { title: "2. المتعاقدون الفرعيون", body: "تُنشر قائمة المتعاقدين الفرعيين وهي قابلة للتحقق. تقوم سوقدز بإشعار المستخدمين التجاريين بأي تغيير جوهري." },
  },
  {
    fr: { title: "3. Exportation et suppression", body: "Les utilisateurs professionnels peuvent demander l'exportation ou la suppression des données traitées, conformément aux réglementations applicables." },
    ar: { title: "3. تصدير البيانات وحذفها", body: "يمكن للمستخدمين التجاريين طلب تصدير البيانات المعالجة أو حذفها وفقاً للأنظمة المعمول بها." },
  },
  {
    fr: { title: "4. Intelligence artificielle", body: "Aucune donnée client n'est utilisée pour entraîner des modèles d'IA sans consentement explicite." },
    ar: { title: "4. الذكاء الاصطناعي", body: "لا تُستخدم أي بيانات للعملاء لتدريب نماذج الذكاء الاصطناعي دون موافقة صريحة." },
  },
  {
    fr: { title: "5. Disponibilité", body: "Tout engagement de SLA en temps réel fait l'objet d'un accord spécifique entre les parties." },
    ar: { title: "5. التوافر", body: "يخضع أي التزام باتفاقية مستوى الخدمة في الوقت الفعلي لاتفاق محدد بين الطرفين." },
  },
];

export default async function DpaPage({ params }: PageProps) {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: dictionary.nav.home, href: `/${resolved}` },
          { label: "DPA", href: `/${resolved}/dpa` },
        ]}
      />
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
        {resolved === "fr" ? "Accord de traitement des données (DPA)" : "اتفاقية معالجة البيانات (DPA)"}
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
