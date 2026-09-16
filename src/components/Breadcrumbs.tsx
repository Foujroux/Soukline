export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden className="text-slate-300 ltr:rotate-0 rtl:rotate-180">
                ›
              </span>
            )}
            {item.href ? (
              <a href={item.href} className="transition-colors hover:text-emerald-700">
                {item.label}
              </a>
            ) : (
              <span className={isLast ? "font-semibold text-slate-700" : ""}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}