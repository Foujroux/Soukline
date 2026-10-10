/**
 * i18n guard: every French string must have an Arabic counterpart.
 *
 * Three classes of problem are reported:
 *
 *   1. Missing / extra keys between `fr` and `ar` in src/lib/dictionary.ts.
 *      `ar` is declared as `typeof fr`, so the compiler already catches most of
 *      this; the script re-checks at runtime so the error survives even if the
 *      type assertion is ever loosened.
 *   2. An Arabic value identical to its French twin, which is almost always a
 *      forgotten translation rather than a deliberate shared string ("TikTok",
 *      "DPA"). Flagged only when the shared text is actually French prose.
 *   3. User-facing French copy hardcoded in a component instead of read from
 *      the dictionary, which bypasses the `ar` object entirely.
 *
 * Exit code is 1 when anything is reported, so it can gate a commit or CI.
 */

import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DICTIONARY = "src/lib/dictionary.ts";

/** Arabic block, U+0600–U+06FF plus the supplement. */
const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

/** Characters that essentially only appear in French text. */
const FRENCH_CHARS = /[àâäéèêëïîôöùûüÿœæçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸŒÆÇ]/;

/**
 * High-signal French words. Short function words are matched only when the
 * string has several of them, to cut down on false positives on things like
 * "notifications" or an English-looking token.
 */
const FRENCH_WORDS = [
  "annonce", "annonces", "vendeur", "vendeur", "acheteur", "recherche",
  "recherchez", "connexion", "inscription", "déconnexion", "mot de passe",
  "annuler", "supprimer", "modifier", "ajouter", "envoyer", "confirmer",
  "erreur", "chargement", "accueil", "gratuit", "gratuite", "wilaya",
  "wilayas", "téléphone", "numéro", "catégorie", "catégories", "publicité",
  "connexion", "conditions", "confidentialité", "disponible", "aucun",
  "aucune", "résultats", "trouvées", "messagerie", "paramètres", "profil",
  "désactivée", "prochainement", "bientôt", "bénéficiez", "abonnez",
  "accéder", "consulter", "publier", "détails", "aucune",
];

const FRENCH_PHRASES = [
  "conditions d'utilisation",
  "politique de confidentialité",
  "comment ça marche",
  "se connecter", "s'inscrire", "se déconnecter",
  "aucune annonce", "se connecter avec", "en savoir plus",
  "tout voir", "voir tout", "charger plus", "résultats trouvés",
];

function looksFrench(text) {
  if (typeof text !== "string" || text.length < 2) return false;
  if (ARABIC.test(text)) return false;
  if (FRENCH_CHARS.test(text)) return true;
  const lower = text.toLowerCase();
  if (FRENCH_PHRASES.some((p) => lower.includes(p))) return true;
  const hits = FRENCH_WORDS.filter((w) =>
    new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu").test(lower)
  ).length;
  return hits >= 2;
}

/** Compiles the TypeScript dictionary to a temp module and imports it. */
async function loadDictionaries() {
  const file = join(ROOT, DICTIONARY);
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  // The module references `@/lib/lang`, which cannot resolve outside the build.
  const dir = mkdtempSync(join(tmpdir(), "i18n-check-"));
  const out = join(dir, "dictionary.mjs");
  writeFileSync(out, outputText);
  return import(out);
}

const problems = [];

// ---------------------------------------------------------------- dictionary
let mod;
try {
  mod = await loadDictionaries();
} catch (error) {
  console.error(`Could not load ${DICTIONARY}: ${error.message}`);
  process.exit(1);
}

const { dictionaries } = mod;
if (!dictionaries?.fr || !dictionaries?.ar) {
  console.error(`${DICTIONARY} must export \`dictionaries\` with fr and ar.`);
  process.exit(1);
}

function walk(fr, ar, path = "") {
  const at = (k) => (path ? `${path}.${k}` : k);
  for (const key of Object.keys(fr)) {
    const f = fr[key];
    const a = ar?.[key];
    if (f && typeof f === "object" && !Array.isArray(f)) {
      if (!a || typeof a !== "object") {
        problems.push({ kind: "missing", where: at(key), detail: "no Arabic object" });
        continue;
      }
      walk(f, a, at(key));
      continue;
    }
    if (a === undefined) {
      problems.push({ kind: "missing", where: at(key), detail: "no Arabic value" });
      continue;
    }
    if (Array.isArray(f)) {
      if (!Array.isArray(a)) {
        problems.push({ kind: "missing", where: at(key), detail: "Arabic is not an array" });
        continue;
      }
      if (a.length !== f.length) {
        problems.push({
          kind: "shape",
          where: at(key),
          detail: `${f.length} French vs ${a.length} Arabic entries`,
        });
      }
      f.forEach((v, i) => {
        if (typeof v === "string" && a[i] === v && looksFrench(v)) {
          problems.push({
            kind: "untranslated",
            where: `${at(key)}[${i}]`,
            detail: `Arabic is identical to French: "${v.slice(0, 60)}"`,
          });
        }
      });
      continue;
    }
    if (typeof f === "string" && typeof a === "string") {
      if (f === a && looksFrench(f)) {
        problems.push({
          kind: "untranslated",
          where: at(key),
          detail: `Arabic is identical to French: "${f.slice(0, 60)}"`,
        });
      } else if (!ARABIC.test(a) && looksFrench(a)) {
        problems.push({
          kind: "untranslated",
          where: at(key),
          detail: `Arabic value looks like French: "${a.slice(0, 60)}"`,
        });
      }
    }
  }
  for (const key of Object.keys(ar ?? {})) {
    if (!(key in fr)) {
      problems.push({
        kind: "extra",
        where: path ? `${path}.${key}` : key,
        detail: "present in Arabic but not in French",
      });
    }
  }
}

walk(dictionaries.fr, dictionaries.ar);

// ------------------------------------------------------- hardcoded literals
// A string literal or JSX text that is French prose living outside the
// dictionary. Anything routed through the dictionary is fine, so this only
// looks at literals in .tsx/.ts files, skipping routes, the dictionary itself,
// data files and identifiers.
const SKIP_FILES = new Set([DICTIONARY]);
const SKIP_DIRS = ["src/app/api/", "src/data/", "src/lib/server-", "src/lib/dictionary"];
const SKIP_LITERAL = [
  /^(https?:|\/|\.|@|#|mailto:|tel:)/,       // urls and paths
  /^[a-z][a-zA-Z0-9_]*$/,                    // identifiers and enum-ish words
  /^\d+$/,
  /^(fr|ar|en)$/,
];

const files = execSync(
  `find src -name "*.tsx" -o -name "*.ts" | sort`,
  { cwd: ROOT, encoding: "utf8" }
).trim().split("\n");

for (const rel of files) {
  if (SKIP_FILES.has(rel)) continue;
  if (SKIP_DIRS.some((d) => rel.startsWith(d))) continue;
  const lines = readFileSync(join(ROOT, rel), "utf8").split("\n");
  lines.forEach((line, i) => {
    if (/^\s*(import|export)\s/.test(line)) return;
    if (/\bclassName=/.test(line) && !/>[^<>{}]{4,}</.test(line)) return;

    const candidates = [
      // JSX text nodes.
      ...[...line.matchAll(/>([^<>{}\n]{4,})</g)].map((m) => m[1]),
      // Accessible / placeholder attributes.
      ...[...line.matchAll(
        /(?:placeholder|title|label|alt|aria-label)=(?:"([^"]{4,})"|\{\s*"([^"]{4,})"\s*\})/g
      )].map((m) => m[1] ?? m[2]),
    ];

    for (const raw of candidates) {
      const text = (raw ?? "").trim();
      if (!text) continue;
      if (SKIP_LITERAL.some((re) => re.test(text))) continue;
      if (!looksFrench(text)) continue;
      problems.push({
        kind: "hardcoded",
        where: `${rel}:${i + 1}`,
        detail: `French copy outside the dictionary: "${text.slice(0, 70)}"`,
      });
    }
  });
}

// ------------------------------------------------------------------- report
const order = { missing: 0, shape: 1, untranslated: 2, extra: 3, hardcoded: 4 };
problems.sort((a, b) => order[a.kind] - order[b.kind] || a.where.localeCompare(b.where));

if (problems.length === 0) {
  console.log("i18n OK: French and Arabic dictionaries match, no hardcoded French UI copy.");
  process.exit(0);
}

const labels = {
  missing: "missing Arabic",
  shape: "shape mismatch",
  untranslated: "untranslated",
  extra: "extra key",
  hardcoded: "hardcoded French",
};

console.error(`i18n check failed: ${problems.length} problem(s)\n`);
for (const p of problems) {
  console.error(`  [${labels[p.kind]}] ${p.where}\n      ${p.detail}`);
}
console.error("\nAdd the Arabic value to src/lib/dictionary.ts, or route the string through it.");
process.exit(1);
