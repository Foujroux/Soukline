export interface Category {
  slug: string;
  fr: string;
  ar: string;
  emoji: string;
  descriptionFr: string;
  descriptionAr: string;
  /**
   * Accent palette. Omit to inherit the default emerald treatment, which every
   * category uses unless it needs to stand apart.
   */
  tone?: CategoryTone;
}

export const CATEGORY_TONES = {
  // Soft gradient for the category tile on the home "Explore Categories" grid.
  default: {
    tile: "bg-gradient-to-br from-emerald-50 to-teal-100",
    cover: "bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-700",
  },
  // Sadakka runs green -> red instead of the emerald-only default.
  greenRed: {
    tile: "bg-gradient-to-br from-emerald-100 via-emerald-50 to-red-100",
    cover: "bg-gradient-to-br from-emerald-600 via-emerald-500 to-red-600",
  },
} as const;

export type CategoryTone = keyof typeof CATEGORY_TONES;

export const CATEGORIES: Category[] = [
  {
    slug: "sadakka",
    fr: "Sadakka",
    ar: "الصدقة",
    emoji: "🤲",
    descriptionFr: "Dons, aumône et œuvres de bienfaisance",
    descriptionAr: "تبرعات، صدقات وأعمال خيرية",
    tone: "greenRed",
  },
  {
    slug: "vehicules",
    fr: "Véhicules",
    ar: "السيارات",
    emoji: "🚗",
    descriptionFr: "Voitures, motos, pièces détachées",
    descriptionAr: "سيارات، دراجات نارية، قطع غيار",
  },
  {
    slug: "immobilier",
    fr: "Immobilier",
    ar: "العقارات",
    emoji: "🏠",
    descriptionFr: "Ventes, locations, bureaux",
    descriptionAr: "بيع، إيجار، مكاتب",
  },
  {
    slug: "emploi",
    fr: "Emploi",
    ar: "الوظائف",
    emoji: "💼",
    descriptionFr: "Offres d'emploi, CV",
    descriptionAr: "عروض عمل، سير ذاتية",
  },
  {
    slug: "electronique",
    fr: "Électronique",
    ar: "الإلكترونيات",
    emoji: "📱",
    descriptionFr: "Téléphones, ordinateurs, TV",
    descriptionAr: "هواتف، حواسيب، تلفزيونات",
  },
  {
    slug: "maison",
    fr: "Maison & Jardin",
    ar: "المنزل والحديقة",
    emoji: "🛋️",
    descriptionFr: "Meubles, électroménager, déco",
    descriptionAr: "أثاث، أجهزة منزلية، ديكور",
  },
  {
    slug: "mode",
    fr: "Mode & Beauté",
    ar: "الموضة والجمال",
    emoji: "👗",
    descriptionFr: "Vêtements, chaussures, bijoux",
    descriptionAr: "ملابس، أحذية، مجوهرات",
  },
  {
    slug: "sports",
    fr: "Sports & Loisirs",
    ar: "الرياضة والترفيه",
    emoji: "⚽",
    descriptionFr: "Vélos, équipement sportif, jeux",
    descriptionAr: "دراجات، معدات رياضية، ألعاب",
  },
  {
    slug: "services",
    fr: "Services",
    ar: "الخدمات",
    emoji: "🛠️",
    descriptionFr: "Plomberie, électricité, cours",
    descriptionAr: "سباكة، كهرباء، دروس",
  },
  {
    slug: "animaux",
    fr: "Animaux",
    ar: "الحيوانات",
    emoji: "🐾",
    descriptionFr: "Chiens, chats, accessoires",
    descriptionAr: "كلاب، قطط، مستلزمات",
  },
  {
    slug: "voyages",
    fr: "Vacances & Voyages",
    ar: "العطلات والسفر",
    emoji: "✈️",
    descriptionFr: "Billets, hébergement, excursions",
    descriptionAr: "تذاكر، إقامة، رحلات",
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoryLabel(category: Category, lang: "fr" | "ar") {
  return lang === "fr" ? category.fr : category.ar;
}

export function getCategoryTone(category: Category | undefined) {
  return CATEGORY_TONES[category?.tone ?? "default"] ?? CATEGORY_TONES.default;
}
