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
    title: `${resolved === "fr" ? "Conditions d'utilisation" : "شروط الاستخدام"} - Souk.dz`,
  };
}

const SECTIONS: { fr: { title: string; body: string }; ar: { title: string; body: string } }[] = [
  {
    fr: { title: "1. Acceptation des conditions", body: "En créant un compte ou en utilisant Souk.dz, vous devez cocher la case d'acceptation de ces Conditions d'utilisation. L'utilisation du service sans cette acceptation est interdite." },
    ar: { title: "1. قبول الشروط", body: "عند إنشاء حساب أو استخدام سوقدز، يجب عليك تحديد خانة الموافقة على شروط الاستخدام هذه. يُحظر استخدام الخدمة دون هذه الموافقة." },
  },
  {
    fr: { title: "2. Limitation de responsabilité", body: "La responsabilité de Souk.dz est limitée au montant des sommes effectivement versées par l'utilisateur au cours des 12 derniers mois. Nous ne garantissons pas un service ininterrompu à 100 % en temps réel, sauf engagement de SLA spécifique souscrit." },
    ar: { title: "2. تحديد المسؤولية", body: "تقتصر مسؤولية سوقدز على المبالغ المدفوعة فعلياً من قبل المستخدم خلال آخر 12 شهراً. لا نضمن خدمة متواصلة بنسبة 100٪ في الوقت الفعلي إلا بموجب اتفاقية مستوى خدمة محددة." },
  },
  {
    fr: { title: "3. Renouvellement automatique", body: "Tout abonnement payant est renouvelé automatiquement à son échéance, sauf résiliation préalable. Ce renouvellement et son montant vous sont clairement indiqués avant toute souscription." },
    ar: { title: "3. التجديد التلقائي", body: "يتم تجديد أي اشتراك مدفوع تلقائياً عند انتهاء مدته ما لم يتم إلغاؤه مسبقاً. يتم توضيح هذا التجديد ومبلغه لك بوضوح قبل أي اشتراك." },
  },
  {
    fr: { title: "4. Annulation en ligne", body: "Vous pouvez annuler votre abonnement à tout moment en ligne, depuis votre compte, sans frais ni pénalité, avec effet à la fin de la période en cours." },
    ar: { title: "4. الإلغاء عبر الإنترنت", body: "يمكنك إلغاء اشتراكك في أي وقت عبر الإنترنت من حسابك، دون رسوم أو غرامات، ويسري الإلغاء في نهاية الفترة الحالية." },
  },
  {
    fr: { title: "5. Certifications", body: "Souk.dz ne prétend pas être certifié SOC 2 ou toute autre certification non obtenue. Toute mention de certification sera accompagnée de sa preuve vérifiable." },
    ar: { title: "5. الشهادات", body: "لا تدّعي سوقدز الحصول على شهادة SOC 2 أو أي شهادة أخرى لم تحصل عليها. أي ذكر لشهادة سيكون مصحوباً بدليل قابل للتحقق." },
  },
  {
    fr: { title: "6. Propriété intellectuelle", body: "Les logos et marques des utilisateurs ou partenaires ne peuvent être utilisés qu'avec leur autorisation écrite préalable." },
    ar: { title: "6. الملكية الفكرية", body: "لا يجوز استخدام شعارات وعلامات المستخدمين أو الشركاء إلا بإذن كتابي مسبق." },
  },
];

export default async function TermsPage({ params }: PageProps) {
  const { lang } = await params;
  const resolved = (isLang(lang) ? lang : normalizeLang(lang)) as "fr" | "ar";
  const dictionary = getDictionary(resolved);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: dictionary.nav.home, href: `/${resolved}` },
          { label: resolved === "fr" ? "Conditions d'utilisation" : "شروط الاستخدام", href: `/${resolved}/conditions` },
        ]}
      />
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
        {resolved === "fr" ? "Conditions d'utilisation" : "شروط الاستخدام"}
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
