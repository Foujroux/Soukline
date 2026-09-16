export interface Category {
  slug: string;
  fr: string;
  ar: string;
  emoji: string;
  descriptionFr: string;
  descriptionAr: string;
}

export const CATEGORIES: Category[] = [
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