export interface Listing {
  id: string;
  slug: string;
  categorySlug: string;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  price: number;
  currency: string;
  wilayaCode: number;
  communeFr: string;
  communeAr: string;
  sellerFr: string;
  sellerAr: string;
  phone: string;
  email: string;
  createdAt: string;
  views: number;
  featured: boolean;
  negotiable: boolean;
  images: string[];
  conditionFr: string;
  conditionAr: string;
}

export const LISTINGS: Listing[] = [
  {
    id: "1",
    slug: "renault-symbol-2019",
    categorySlug: "vehicules",
    titleFr: "Renault Symbol 2019 Climatisée - Très bon état",
    titleAr: "رونو سيمبول 2019 مكيفة - حالة جيدة جدا",
    descriptionFr:
      "Renault Symbol 2019, essence, 145000 km, première main, climatisation, direction assistée, vitres électriques. Contrôle technique valide, carte grise à jour. Prix négociable. Pas de vices cachés.",
    descriptionAr:
      "رونو سيمبول 2019، بنزين، 145000 كم، ملك أول، مكيفة، مقود مساعد، نوافذ كهربائية. الفحص التقني ساري المفعول، البطاقة الرمادية محدثة. السعر قابل للتفاوض. بدون عيوب خفية.",
    price: 14500000,
    currency: "DA",
    wilayaCode: 16,
    communeFr: "Bab Ezzouar",
    communeAr: "باب الزوار",
    sellerFr: "Mohamed R.",
    sellerAr: "محمد ر.",
    phone: "0550 12 34 56",
    email: "mohamed@example.com",
    createdAt: "2026-09-10",
    views: 342,
    featured: true,
    negotiable: true,
    images: [],
    conditionFr: "Très bon état",
    conditionAr: "حالة جيدة جدا",
  },
  {
    id: "2",
    slug: "appartement-3-pieces-oran",
    categorySlug: "immobilier",
    titleFr: "Appartement F3 - Bir El Djir, Oran",
    titleAr: "شقة 3 غرف - بئر الجير، وهران",
    descriptionFr:
      "Bel appartement F3 de 95 m² dans une résidence calme à Bir El Djir. Cuisine équipée, carrelage en marbre, 2 chambres, salon spacieux, immeuble avec ascenseur. Proche des commodités. Acte notarié.",
    descriptionAr:
      "شقة جميلة 3 غرف بمساحة 95 متر مربع في إقامة هادئة ببئر الجير. مطبخ مجهز، أرضية رخامية، غرفتان نوم، صالون واسع، عمارة بمصعد. قريبة من المرافق. عقد موثق.",
    price: 52000000,
    currency: "DA",
    wilayaCode: 31,
    communeFr: "Bir El Djir",
    communeAr: "بئر الجير",
    sellerFr: "Khadidja B.",
    sellerAr: "خديجة ب.",
    phone: "0661 98 76 54",
    email: "khadidja@example.com",
    createdAt: "2026-09-12",
    views: 812,
    featured: true,
    negotiable: true,
    images: [],
    conditionFr: "Bon état",
    conditionAr: "حالة جيدة",
  },
  {
    id: "3",
    slug: "iphone-13-pro-256",
    categorySlug: "electronique",
    titleFr: "iPhone 13 Pro 256 Go - Neuf sous garantie",
    titleAr: "آيفون 13 برو 256 جيجا - جديد تحت الضمان",
    descriptionFr:
      "iPhone 13 Pro 256 Go Graphite, neuf jamais utilisé, encore sous garantie. Facture de l'agréé disponible. Accessoires d'origine. Batterie 100%.",
    descriptionAr:
      "آيفون 13 برو 256 جيجا بلون رمادي، جديد لم يُستخدم أبدًا، لا يزال تحت الضمان. فاتورة الوكيل متوفرة. الملحقات الأصلية. البطارية 100%.",
    price: 165000,
    currency: "DA",
    wilayaCode: 9,
    communeFr: "Blida",
    communeAr: "البليدة",
    sellerFr: "Amine K.",
    sellerAr: "أمين ك.",
    phone: "0770 11 22 33",
    email: "amine@example.com",
    createdAt: "2026-09-13",
    views: 567,
    featured: true,
    negotiable: false,
    images: [],
    conditionFr: "Neuf",
    conditionAr: "جديد",
  },
  {
    id: "4",
    slug: "chauffeur-livreur-alger",
    categorySlug: "emploi",
    titleFr: "Chauffeur-livreur expérimenté - Alger",
    titleAr: "سائق توصيل ذو خبرة - الجزائر",
    descriptionFr:
      "Dépôt de candidature : chauffeur-livreur expérimenté pour société de livraison à Alger. Permis B + permis de conduire depuis 8 ans, connaissance parfaite de la ville. Salaire attractif + primes.",
    descriptionAr:
      "طلب وظيفة: سائق توصيل ذو خبرة لشركة توصيل في الجزائر. رخصة قيادة لأكثر من 8 سنوات، معرفة كاملة بمدينة الجزائر. راتب جذاب + مكافآت.",
    price: 45000,
    currency: "DA",
    wilayaCode: 16,
    communeFr: "Alger Centre",
    communeAr: "الجزائر الوسطى",
    sellerFr: "SARL Express DZ",
    sellerAr: "مؤسسة Express DZ",
    phone: "023 45 67 89",
    email: "recrutement@expressdz.dz",
    createdAt: "2026-09-08",
    views: 1289,
    featured: true,
    negotiable: true,
    images: [],
    conditionFr: "-",
    conditionAr: "-",
  },
  {
    id: "5",
    slug: "salon-bois-massif-setif",
    categorySlug: "maison",
    titleFr: "Salon complet en bois massif - Sétif",
    titleAr: "صالون كامل من الخشب الصلب - سطيف",
    descriptionFr:
      "Salon algérois en bois massif, 7 pièces, très bon état. Coussins en mousse haute densité. Style traditionnel moderne. Livraison possible sur Sétif et environs.",
    descriptionAr:
      "صالون جزائري من الخشب الصلب، 7 قطع، حالة جيدة جدًا. وسائد إسفنجية عالية الكثافة. طراز تقليدي عصري. إمكانية التوصيل في سطيف والمناطق المجاورة.",
    price: 350000,
    currency: "DA",
    wilayaCode: 19,
    communeFr: "Sétif",
    communeAr: "سطيف",
    sellerFr: "Fatima Z.",
    sellerAr: "فاطمة ز.",
    phone: "0555 44 33 22",
    email: "fatima@example.com",
    createdAt: "2026-09-05",
    views: 233,
    featured: false,
    negotiable: true,
    images: [],
    conditionFr: "Très bon état",
    conditionAr: "حالة جيدة جدا",
  },
  {
    id: "6",
    slug: "peugeot-208-active",
    categorySlug: "vehicules",
    titleFr: "Peugeot 208 Active 2021 - Diesel",
    titleAr: "بيجو 208 أكتيف 2021 - ديزل",
    descriptionFr:
      "Peugeot 208 Active 2021 diesel, 87000 km, entretenue en concession, pneus neufs. Boîte manuelle 5 rapports. Consommation réduite. Départ Tizi Ouzou.",
    descriptionAr:
      "بيجو 208 أكتيف 2021 ديزل، 87000 كم، صيانتها في الوكالة، إطارات جديدة. علبة يدوية 5 سرعات. استهلاك قليل. مكان الانطلاق من تيزي وزو.",
    price: 1980000,
    currency: "DA",
    wilayaCode: 15,
    communeFr: "Tizi Ouzou",
    communeAr: "تيزي وزو",
    sellerFr: "Yacine H.",
    sellerAr: "ياسين ح.",
    phone: "0662 00 11 22",
    email: "yacine@example.com",
    createdAt: "2026-09-11",
    views: 198,
    featured: false,
    negotiable: true,
    images: [],
    conditionFr: "Bon état",
    conditionAr: "حالة جيدة",
  },
  {
    id: "7",
    slug: "ordinateur-portable-hp-core-i7",
    categorySlug: "electronique",
    titleFr: "HP Pavilion Gaming Core i7 - 16 Go RAM",
    titleAr: "إتش بي بافيليون جيمينق كور i7 - 16 جيجا رام",
    descriptionFr:
      "HP Pavilion Gaming, Core i7 11e génération, 16 Go RAM, RTX 3050, 512 Go SSD NVMe. Écran 144Hz. Très peu utilisé, raison : changement. Avec sacoche + souris gamer.",
    descriptionAr:
      "إتش بي بافيليون جيمينق، كور i7 جيل 11، 16 جيجا رام، RTX 3050، 512 جيجا SSD NVMe. شاشة 144 هرتز. استعمال قليل جدًا، السبب: تغيير. مع حقيبة + فأرة ألعاب.",
    price: 145000,
    currency: "DA",
    wilayaCode: 25,
    communeFr: "Constantine",
    communeAr: "قسنطينة",
    sellerFr: "Riad M.",
    sellerAr: "رياض م.",
    phone: "0551 23 45 67",
    email: "riad@example.com",
    createdAt: "2026-09-14",
    views: 402,
    featured: true,
    negotiable: true,
    images: [],
    conditionFr: "Très bon état",
    conditionAr: "حالة جيدة جدا",
  },
  {
    id: "8",
    slug: "terrain-construction-annaba",
    categorySlug: "immobilier",
    titleFr: "Terrain à bâtir - Annaba, 250 m²",
    titleAr: "أرض للبناء - عنابة، 250 متر مربع",
    descriptionFr:
      "Terrain constructible de 250 m² à la sortie d'Annaba, zone viabilisée, eau et électricité au niveau du terrain. Titre qui permet la construction immédiate. Prix ferme.",
    descriptionAr:
      "أرض قابلة للبناء بمساحة 250 متر مربع عند مخرج عنابة، المنطقة مجهزة، المياه والكهرباء متوفران على مستوى الأرض. عقد يسمح بالبناء الفوري. السعر ثابت.",
    price: 4200000,
    currency: "DA",
    wilayaCode: 23,
    communeFr: "Annaba",
    communeAr: "عنابة",
    sellerFr: "Brahim L.",
    sellerAr: "إبراهيم ل.",
    phone: "0771 66 77 88",
    email: "brahim@example.com",
    createdAt: "2026-09-02",
    views: 655,
    featured: false,
    negotiable: false,
    images: [],
    conditionFr: "-",
    conditionAr: "-",
  },
  {
    id: "9",
    slug: "cours-particuliers-maths",
    categorySlug: "services",
    titleFr: "Cours particuliers de maths - Prépas & Lycée",
    titleAr: "دروس خصوصية في الرياضيات - ثانوي وتحضيري",
    descriptionFr:
      "Ingénieur en génie civil donne des cours particuliers de mathématiques à domicile (Alger) ou en ligne. Préparation BAC et classes prépas. Premier cours d'essai gratuit.",
    descriptionAr:
      "مهندس في الهندسة المدنية يقدم دروسًا خصوصية في الرياضيات في المنزل (الجزائر) أو عبر الإنترنت. تحضير للبكالوريا والأقسام التحضيرية. الدرس الأول مجاني.",
    price: 1500,
    currency: "DA",
    wilayaCode: 16,
    communeFr: "Hydra",
    communeAr: "حيدرة",
    sellerFr: "Sofiane D.",
    sellerAr: "سفيان د.",
    phone: "0553 98 76 54",
    email: "sofiane@example.com",
    createdAt: "2026-09-09",
    views: 320,
    featured: false,
    negotiable: true,
    images: [],
    conditionFr: "-",
    conditionAr: "-",
  },
  {
    id: "10",
    slug: "chiot-berger-allemand",
    categorySlug: "animaux",
    titleFr: "Chiot Berger Allemand - Vacciné, puce électronique",
    titleAr: "جرو كلب ألماني - ملقّح، بشرائح إلكترونية",
    descriptionFr:
      "Chiot berger allemand de 2 mois, né en Algérie, parents LOF importés. Vaccins à jour, vermifugé, puce électronique. Livre avec certificat de naissance.",
    descriptionAr:
      "جرو كلب ألماني عمره شهران، وُلد في الجزائر، الأبوين بمواصفات أصلية مستوردة. التلقيحات محدثة، ومطهّر من الديدان، مع شريحة إلكترونية. يُسلم مع شهادة الميلاد.",
    price: 60000,
    currency: "DA",
    wilayaCode: 16,
    communeFr: "Kouba",
    communeAr: "القبة",
    sellerFr: "Nadir C.",
    sellerAr: "نذير س.",
    phone: "0799 55 66 77",
    email: "nadir@example.com",
    createdAt: "2026-09-13",
    views: 189,
    featured: false,
    negotiable: false,
    images: [],
    conditionFr: "-",
    conditionAr: "-",
  },
  {
    id: "11",
    slug: "veld-sport-grande-taille",
    categorySlug: "sports",
    titleFr: "Vélo VTT grande taille - Marque Giant",
    titleAr: "دراجة جبلية كبيرة الحجم - ماركة جايانت",
    descriptionFr:
      "Vélo VTT Giant Atx, cadre 21, 21 vitesses, freins à disque. Très bon état, révisé récemment. Parfait pour la montagne et la ville. Casque offert.",
    descriptionAr:
      "دراجة جبلية جايانت Atx، هيكل 21، 21 سرعة، فرامل قرصية. حالة جيدة جدًا، خضعت لصيانة حديثة. مثالية للجبل والمدينة. مع خوذة هدية.",
    price: 45000,
    currency: "DA",
    wilayaCode: 24,
    communeFr: "Guelma",
    communeAr: "قالمة",
    sellerFr: "Sara B.",
    sellerAr: "سارة ب.",
    phone: "0552 11 22 33",
    email: "sara@example.com",
    createdAt: "2026-09-06",
    views: 134,
    featured: false,
    negotiable: true,
    images: [],
    conditionFr: "Très bon état",
    conditionAr: "حالة جيدة جدا",
  },
  {
    id: "12",
    slug: "jupe-mensonge-2024",
    categorySlug: "mode",
    titleFr: "Djellaba & Mensonge brodés - tenues traditionnelles",
    titleAr: "جالابية و منسوج - أزياء تقليدية",
    descriptionFr:
      "Ensemble de tenues traditionnelles algériennes : djellaba en satin, mensonge décoré. Tailles différentes disponibles. Feat occasion : mariage, fêtes. Inventaire boutique Oran.",
    descriptionAr:
      "مجموعة أزياء جزائرية تقليدية: جلابية ساتان، منسوج مزخرف. مقاسات مختلفة متوفرة. مناسبة للمناسبات: الأعراس والأعياد. من مورد بمحل بوهران.",
    price: 18000,
    currency: "DA",
    wilayaCode: 31,
    communeFr: "Oran",
    communeAr: "وهران",
    sellerFr: "Meriem T.",
    sellerAr: "مريم ت.",
    phone: "0770 88 99 00",
    email: "meriem@example.com",
    createdAt: "2026-09-12",
    views: 276,
    featured: false,
    negotiable: true,
    images: [],
    conditionFr: "Neuf",
    conditionAr: "جديد",
  },
  {
    id: "13",
    slug: "appartement-f4-bab-ezzouar",
    categorySlug: "immobilier",
    titleFr: "Appartement F4 - Bab Ezzouar, Alger",
    titleAr: "شقة 4 غرف - باب الزوار، الجزائر",
    descriptionFr:
      "Appartement F4 de 120 m² au 3e étage, Bab Ezzouar. Salon + 3 chambres, cuisine équipée, double vitrage. Exposition sud. Proche de toutes les commodités et du métro. Prix ferme.",
    descriptionAr:
      "شقة 4 غرف بمساحة 120 متر مربع في الطابق الثالث، باب الزوار. صالون + 3 غرف نوم، مطبخ مجهز، زجاج مزدوج. واجهة جنوبية. قريبة من جميع المرافق والمترو. السعر ثابت.",
    price: 68000000,
    currency: "DA",
    wilayaCode: 16,
    communeFr: "Bab Ezzouar",
    communeAr: "باب الزوار",
    sellerFr: "Lila H.",
    sellerAr: "ليلى ه.",
    phone: "0660 12 34 56",
    email: "lila@example.com",
    createdAt: "2026-09-14",
    views: 943,
    featured: true,
    negotiable: false,
    images: [],
    conditionFr: "Très bon état",
    conditionAr: "حالة جيدة جدا",
  },
  {
    id: "14",
    slug: "refrigerateur-lg-450l",
    categorySlug: "maison",
    titleFr: "Réfrigérateur LG 450L Inverter - Neuf",
    titleAr: "ثلاجة LG 450 لتر إنفرتر - جديدة",
    descriptionFr:
      "Réfrigérateur LG 450L, technologie Inverter, neuf encore dans son emballage. Livré à domicile à Constantine et environs. Facture disponible. Méthode de paiement : comptant.",
    descriptionAr:
      "ثلاجة LG سعة 450 لتر، تقنية إنفرتر، جديدة لا تزال في تغليفها. توصيل للمنزل في قسنطينة والمناطق المجاورة. الفاتورة متوفرة. طريقة الدفع: نقدًا.",
    price: 115000,
    currency: "DA",
    wilayaCode: 25,
    communeFr: "Constantine",
    communeAr: "قسنطينة",
    sellerFr: "Electro Plus",
    sellerAr: "محل Electro Plus",
    phone: "031 93 21 87",
    email: "contact@electroplus.dz",
    createdAt: "2026-09-10",
    views: 311,
    featured: false,
    negotiable: false,
    images: [],
    conditionFr: "Neuf",
    conditionAr: "جديد",
  },
  {
    id: "15",
    slug: "billet-avion-paris-alger",
    categorySlug: "voyages",
    titleFr: "Billet avion Alger-Paris aller-retour - Novembre",
    titleAr: "تذكرة طيران الجزائر-باريس ذهاب وإياب - نوفمبر",
    descriptionFr:
      "Vends billet aller-retour Alger (ALG) - Paris (CDG) pour novembre, vol direct Air Algérie. Acheté pour un voyage annulé. Non remboursable. Transfert de nom possible auprès de la compagnie.",
    descriptionAr:
      "أبيع تذكرة ذهاب وإياب الجزائر (ALG) - باريس (CDG) لشهر نوفمبر، رحلة مباشرة الخطوط الجوية الجزائرية. اشتريتها لرحلة ملغاة. غير قابلة للاسترداد. إمكانية نقل الاسم لدى الشركة.",
    price: 92000,
    currency: "DA",
    wilayaCode: 16,
    communeFr: "Alger",
    communeAr: "الجزائر",
    sellerFr: "Sami R.",
    sellerAr: "سامي ر.",
    phone: "0556 44 55 66",
    email: "sami@example.com",
    createdAt: "2026-09-07",
    views: 208,
    featured: false,
    negotiable: false,
    images: [],
    conditionFr: "-",
    conditionAr: "-",
  },
];

export function getListingById(id: string): Listing | undefined {
  return LISTINGS.find((l) => l.id === id);
}

export function getListingBySlug(slug: string): Listing | undefined {
  return LISTINGS.find((l) => l.slug === slug);
}

export function getListingsByCategory(categorySlug: string): Listing[] {
  return LISTINGS.filter((l) => l.categorySlug === categorySlug);
}

export function getFeaturedListings(): Listing[] {
  return LISTINGS.filter((l) => l.featured).slice(0, 8);
}

export function getRecentListings(count = 8): Listing[] {
  return [...LISTINGS]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, count);
}

export function formatPrice(price: number, lang: "fr" | "ar"): string {
  const formatted = new Intl.NumberFormat(lang === "ar" ? "ar-DZ" : "fr-DZ", {
    maximumFractionDigits: 0,
  }).format(price);
  return lang === "ar" ? `${formatted} دج` : `${formatted} DA`;
}

export interface ListingFilters {
  query?: string;
  categorySlug?: string;
  wilayaCode?: number;
  minPrice?: number;
  maxPrice?: number;
  negotiableOnly?: boolean;
}

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function searchListings(filters: ListingFilters): Listing[] {
  return LISTINGS.filter((l) => {
    if (filters.categorySlug && filters.categorySlug !== "tous" && l.categorySlug !== filters.categorySlug)
      return false;
    if (filters.wilayaCode && l.wilayaCode !== filters.wilayaCode) return false;
    if (filters.minPrice != null && !Number.isNaN(filters.minPrice) && l.price < filters.minPrice) return false;
    if (filters.maxPrice != null && !Number.isNaN(filters.maxPrice) && l.price > filters.maxPrice) return false;
    if (filters.negotiableOnly && !l.negotiable) return false;
    if (filters.query) {
      const q = normalizeSearchText(filters.query);
      const haystack = normalizeSearchText(
        `${l.titleFr} ${l.titleAr} ${l.descriptionFr} ${l.descriptionAr} ${l.communeFr} ${l.communeAr} ${l.sellerFr} ${l.sellerAr}`
      );
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export type SortOrder = "newest" | "oldest" | "price_asc" | "price_desc";

export function sortListings(listings: Listing[], sort: SortOrder): Listing[] {
  const copy = [...listings];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

export function getSimilarListings(listing: Listing, count = 4): Listing[] {
  return LISTINGS.filter(
    (l) => l.categorySlug === listing.categorySlug && l.id !== listing.id
  ).slice(0, count);
}