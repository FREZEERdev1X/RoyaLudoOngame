import { PawnSkin, DiceSkin, BoardSkin } from '../types/game';

export const VIP_EMAIL = 'hamodydeab3@gmail.com';

export const PAWN_SKINS: PawnSkin[] = [
  {
    id: 'classic',
    name: {
      ar: 'الكلاسيكي الأصيل',
      en: 'Classic Royale',
      fr: 'Royale Classique',
      es: 'Clásico Real',
      tr: 'Klasik Kraliyet',
    },
    priceCoins: 0,
    priceGems: 0,
    rarity: 'common',
    colorPalette: {
      red: '#ef4444',
      green: '#10b981',
      yellow: '#eab308',
      blue: '#3b82f6',
      glow: 'rgba(255,255,255,0.3)',
      border: '#ffffff',
    },
    iconName: 'Crown',
    description: {
      ar: 'التصميم الكلاسيكي المحبوب مع لمعان خفيف وألوان زاهية.',
      en: 'The classic beloved design with subtle gloss and vibrant colors.',
    },
  },
  {
    id: 'golden_sultan',
    name: {
      ar: 'السلطان الذهبي 👑',
      en: 'Golden Sultan',
      fr: 'Sultan Doré',
      es: 'Sultán Dorado',
      tr: 'Altın Sultan',
    },
    priceCoins: 5000,
    priceGems: 50,
    rarity: 'epic',
    colorPalette: {
      red: '#e11d48',
      green: '#059669',
      yellow: '#d97706',
      blue: '#2563eb',
      glow: '#fbbf24',
      border: '#fde047',
    },
    iconName: 'Gem',
    description: {
      ar: 'قطع ملكية مرصعة بالذهب الخالص والياقوت والزمرد الفاخر.',
      en: 'Royal pieces encrusted with pure gold, rubies, and emeralds.',
    },
  },
  {
    id: 'cyberpunk_neon',
    name: {
      ar: 'السايبربانك النيون ⚡',
      en: 'Cyberpunk Neon',
      fr: 'Néon Cyberpunk',
      es: 'Neón Cyberpunk',
      tr: 'Siberpunk Neon',
    },
    priceCoins: 8500,
    priceGems: 80,
    rarity: 'legendary',
    colorPalette: {
      red: '#ff0055',
      green: '#00ffaa',
      yellow: '#ffe600',
      blue: '#00ccff',
      glow: '#00ffff',
      border: '#00ffcc',
    },
    iconName: 'Zap',
    description: {
      ar: 'تأثيرات هولوغرام مستقبلية مع توهج نيون متحرك وصوت مستقبلي.',
      en: 'Futuristic holographic effects with animated neon glow.',
    },
  },
  {
    id: 'arabian_knights',
    name: {
      ar: 'فرسان الأندلس ⚔️',
      en: 'Arabian Knights',
      fr: 'Chevaliers Arabes',
      es: 'Caballeros Árabes',
      tr: 'Arap Şövalyeleri',
    },
    priceCoins: 12000,
    priceGems: 120,
    rarity: 'legendary',
    colorPalette: {
      red: '#991b1b',
      green: '#065f46',
      yellow: '#b45309',
      blue: '#1e40af',
      glow: '#fbbf24',
      border: '#f59e0b',
    },
    iconName: 'Shield',
    description: {
      ar: 'دروع وتيجان فرسان الشرق مع نقوش وزخارف أندلسية عريقة.',
      en: 'Shields and crowns with intricate Andalusian ornaments.',
    },
  },
  {
    id: 'cosmic_galaxy',
    name: {
      ar: 'المجرة الكونية 🌌',
      en: 'Cosmic Galaxy',
      fr: 'Galaxie Cosmique',
      es: 'Galaxia Cósmica',
      tr: 'Kozmik Galaksi',
    },
    priceCoins: 20000,
    priceGems: 200,
    rarity: 'mythic',
    colorPalette: {
      red: '#ec4899',
      green: '#14b8a6',
      yellow: '#facc15',
      blue: '#8b5cf6',
      glow: '#c084fc',
      border: '#e879f9',
    },
    iconName: 'Sparkles',
    description: {
      ar: 'نجوم مشتعلة وسدم فضائية ساحرة مع مسار غباري براق خلف كل حركة.',
      en: 'Burning star dust and cosmic nebula trail with every step.',
    },
  },
  {
    id: 'fire_ice_dragon',
    name: {
      ar: 'تنين النار والجليد 🐉',
      en: 'Fire & Ice Dragon',
      fr: 'Dragon de Feu & Glace',
      es: 'Dragón de Fuego y Hielo',
      tr: 'Ateş ve Buz Ejderhası',
    },
    priceCoins: 30000,
    priceGems: 300,
    rarity: 'mythic',
    colorPalette: {
      red: '#dc2626',
      green: '#0d9488',
      yellow: '#ea580c',
      blue: '#0284c7',
      glow: '#38bdf8',
      border: '#f97316',
    },
    iconName: 'Flame',
    description: {
      ar: 'قوة التنين الأسطورية مع لهب الحمم وجليد القطبين المتوهج.',
      en: 'Legendary dragon power with molten flame and frozen arctic ice aura.',
    },
  },
];

export const DICE_SKINS: DiceSkin[] = [
  {
    id: 'dice_classic',
    name: {
      ar: 'النرد العاجي الكلاسيكي',
      en: 'Classic Ivory Dice',
      fr: 'Dé Ivoire Classique',
      es: 'Dado Clásico de Marfil',
      tr: 'Klasik Fildişi Zar',
    },
    priceCoins: 0,
    priceGems: 0,
    rarity: 'common',
    bgGradient: 'from-amber-50 to-amber-100',
    dotColor: '#1e293b',
    glowColor: 'rgba(0,0,0,0.1)',
    iconName: 'Dices',
  },
  {
    id: 'dice_gold',
    name: {
      ar: 'نرد الذهب الخالص 💎',
      en: 'Pure Gold Dice',
      fr: 'Dé en Or Pur',
      es: 'Dado de Oro Puro',
      tr: 'Saf Altın Zar',
    },
    priceCoins: 4000,
    priceGems: 40,
    rarity: 'rare',
    bgGradient: 'from-amber-300 via-yellow-400 to-amber-600',
    dotColor: '#78350f',
    glowColor: '#f59e0b',
    iconName: 'Crown',
  },
  {
    id: 'dice_cyber',
    name: {
      ar: 'نرد السايبر المستقبلي ⚡',
      en: 'Cyber Neon Dice',
      fr: 'Dé Cyber Néon',
      es: 'Dado Cyber Neón',
      tr: 'Siber Neon Zar',
    },
    priceCoins: 7500,
    priceGems: 75,
    rarity: 'epic',
    bgGradient: 'from-cyan-900 via-slate-900 to-purple-950',
    dotColor: '#00ffff',
    glowColor: '#06b6d4',
    iconName: 'Zap',
  },
  {
    id: 'dice_ruby',
    name: {
      ar: 'نرد الياقوت البركاني 🔥',
      en: 'Volcanic Ruby Dice',
      fr: 'Dé Rubis Volcanique',
      es: 'Dado Rubí Volcánico',
      tr: 'Volkanik Yakut Zar',
    },
    priceCoins: 11000,
    priceGems: 110,
    rarity: 'legendary',
    bgGradient: 'from-red-600 via-rose-700 to-red-950',
    dotColor: '#fef08a',
    glowColor: '#ef4444',
    iconName: 'Flame',
  },
  {
    id: 'dice_diamond',
    name: {
      ar: 'نرد الماس البراق 🌟',
      en: 'Diamond Prism Dice',
      fr: 'Dé Prisme Diamant',
      es: 'Dado Prisma Diamante',
      tr: 'Elmas Prizma Zar',
    },
    priceCoins: 25000,
    priceGems: 250,
    rarity: 'mythic',
    bgGradient: 'from-blue-200 via-indigo-300 to-purple-400',
    dotColor: '#1e1b4b',
    glowColor: '#818cf8',
    iconName: 'Sparkles',
  },
];

export const BOARD_SKINS: BoardSkin[] = [
  {
    id: 'board_classic',
    name: {
      ar: 'رقعة الحديقة الكلاسيكية',
      en: 'Classic Meadow Board',
      fr: 'Plateau Prairie Classique',
      es: 'Tablero Clásico',
      tr: 'Klasik Çayır Tahtası',
    },
    priceCoins: 0,
    priceGems: 0,
    rarity: 'common',
    bgTheme: 'bg-emerald-950/80',
    boardBg: '#ffffff',
    pathTileBg: '#f8fafc',
    gridLineColor: '#cbd5e1',
    previewUrl: 'classic',
  },
  {
    id: 'board_royal_velvet',
    name: {
      ar: 'المخمل الملكي والذهب 👑',
      en: 'Royal Velvet & Gold',
      fr: 'Velours Royal & Or',
      es: 'Terciopelo Real y Oro',
      tr: 'Kraliyet Kadife ve Altın',
    },
    priceCoins: 6000,
    priceGems: 60,
    rarity: 'epic',
    bgTheme: 'bg-amber-950/80',
    boardBg: '#1c1917',
    pathTileBg: '#292524',
    gridLineColor: '#eab308',
    previewUrl: 'royal',
  },
  {
    id: 'board_cyber_grid',
    name: {
      ar: 'الشبكة الإلكترونية 🌐',
      en: 'Cyber Hologram Grid',
      fr: 'Grille Hologramme Cyber',
      es: 'Rejilla Cibernética',
      tr: 'Siber Hologram Ağı',
    },
    priceCoins: 10000,
    priceGems: 100,
    rarity: 'legendary',
    bgTheme: 'bg-slate-950',
    boardBg: '#090d16',
    pathTileBg: '#0f172a',
    gridLineColor: '#06b6d4',
    previewUrl: 'cyber',
  },
  {
    id: 'board_marble_palace',
    name: {
      ar: 'قصر الرخام الإمبراطوري 🏛️',
      en: 'Imperial Marble Palace',
      fr: 'Palais de Marbre Impérial',
      es: 'Palacio de Mármol',
      tr: 'Mermer Saray',
    },
    priceCoins: 18000,
    priceGems: 180,
    rarity: 'legendary',
    bgTheme: 'bg-stone-900',
    boardBg: '#fafaf9',
    pathTileBg: '#f5f5f4',
    gridLineColor: '#a8a29e',
    previewUrl: 'marble',
  },
  {
    id: 'board_desert_oasis',
    name: {
      ar: 'واحة الشرق الذهبية 🏜️',
      en: 'Golden Desert Oasis',
      fr: 'Oasis du Désert Doré',
      es: 'Oasis del Desierto',
      tr: 'Altın Çöl Vahası',
    },
    priceCoins: 28000,
    priceGems: 280,
    rarity: 'mythic',
    bgTheme: 'bg-yellow-950/90',
    boardBg: '#1e140a',
    pathTileBg: '#2d1e0f',
    gridLineColor: '#f59e0b',
    previewUrl: 'oasis',
  },
];

// Check if user is the special VIP Hamody account
export function isSpecialVipUser(email?: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === VIP_EMAIL.toLowerCase();
}

// Get unlocked pawn skins for user
export function getUserUnlockedPawnSkins(userEmail?: string, userUnlocked?: string[]): string[] {
  if (isSpecialVipUser(userEmail)) {
    return PAWN_SKINS.map((s) => s.id);
  }
  const defaultList = ['classic'];
  if (userUnlocked && userUnlocked.length > 0) {
    return Array.from(new Set([...defaultList, ...userUnlocked]));
  }
  return defaultList;
}

export function getUserUnlockedDiceSkins(userEmail?: string, userUnlocked?: string[]): string[] {
  if (isSpecialVipUser(userEmail)) {
    return DICE_SKINS.map((s) => s.id);
  }
  const defaultList = ['dice_classic'];
  if (userUnlocked && userUnlocked.length > 0) {
    return Array.from(new Set([...defaultList, ...userUnlocked]));
  }
  return defaultList;
}

export function getUserUnlockedBoardSkins(userEmail?: string, userUnlocked?: string[]): string[] {
  if (isSpecialVipUser(userEmail)) {
    return BOARD_SKINS.map((s) => s.id);
  }
  const defaultList = ['board_classic'];
  if (userUnlocked && userUnlocked.length > 0) {
    return Array.from(new Set([...defaultList, ...userUnlocked]));
  }
  return defaultList;
}
