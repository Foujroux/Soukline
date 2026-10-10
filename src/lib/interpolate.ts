/**
 * Substitutes `{name}` placeholders in a translated string.
 *
 * The dictionary already ships templates like "{count} annonces trouvées" and
 * "il y a {days} jours", but nothing existed to fill them in. Keeping this in
 * one place means callers never hand-roll a replace loop, and a missing value
 * degrades to the placeholder rather than printing "undefined" at a user.
 */
export function interpolate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}
