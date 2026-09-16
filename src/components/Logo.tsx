interface LogoProps {
  dictionary: any;
  lang: string;
}

export default function Logo({ dictionary, lang }: LogoProps) {
  void dictionary;
  return (
    <a
      href={`/${lang}`}
      className="flex items-center gap-2 rounded-xl px-1 py-1 transition-transform hover:scale-[1.02]"
      aria-label="Souk.dz"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-xl font-black text-white shadow-lg shadow-emerald-600/20">
        س
        <span className="absolute sr-only">S</span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-2xl font-extrabold tracking-tight text-slate-900">
          Souk<span className="text-emerald-600">.dz</span>
        </span>
        <span className="text-[10px] font-medium tracking-widest text-emerald-700/80 uppercase">
          {lang === "ar" ? "السوق الجزائري الرقمي" : "Le souk algérien, en ligne"}
        </span>
      </span>
    </a>
  );
}