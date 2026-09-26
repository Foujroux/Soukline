import { isLang, normalizeLang } from "@/lib/lang";
import { getDictionary } from "@/lib/i18n";
import OAuthCallback from "./OAuthCallback";

export default async function AuthCallbackPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const resolved = isLang(lang) ? lang : normalizeLang(lang);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <OAuthCallback lang={resolved} dictionary={getDictionary(resolved)} />
    </div>
  );
}
