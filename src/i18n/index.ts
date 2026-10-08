import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json' with { type: 'json' };
import ta from './locales/ta.json' with { type: 'json' };
import hi from './locales/hi.json' with { type: 'json' };

export const supportedLanguages = [
  { code: 'en', nativeName: 'English' },
  { code: 'ta', nativeName: 'தமிழ்' },
  { code: 'hi', nativeName: 'हिन्दी' }
];

// Determine initial language: localStorage or browser language (ta, hi, or en)
const detectBrowserLanguage = (): string => {
  const saved = localStorage.getItem('marudhamx_lang');
  if (saved && (saved === 'ta' || saved === 'hi' || saved === 'en')) {
    return saved;
  }
  const browser = typeof navigator !== 'undefined' ? (navigator.language || '').toLowerCase() : 'en';
  if (browser.startsWith('ta')) return 'ta';
  if (browser.startsWith('hi')) return 'hi';
  return 'en';
};

const initialLang = detectBrowserLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
      hi: { translation: hi }
    },
    lng: initialLang,
    // fallbackLng: empty array for Tamil so missing key shows key rather than English
    fallbackLng: {
      ta: [],
      default: ['en']
    },
    interpolation: {
      escapeValue: false
    }
  });

export function updatePageMetadata(lang: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = 'ltr';

  if (lang === 'ta') {
    document.title = 'மருதம்எக்ஸ் - அழுகக்கூடிய விளைபொருள் போக்குவரத்து திட்டமிடுபவர்';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'மருதம்எக்ஸ் நிஜ சாலை வலையமைப்பில் விளைபொருள் போக்குவரத்தை திட்டமிடுகிறது மற்றும் லாரிகளை கணக்கிடுகிறது.');
    }
  } else if (lang === 'hi') {
    document.title = 'मरुधमएक्स - शीघ्र खराब होने वाली उपज परिवहन योजनाकार';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'मरुधमएक्स वास्तविक सड़क नेटवर्क पर उपज परिवहन की योजना बनाता है।');
    }
  } else {
    document.title = 'MarudhamX - Perishable Produce Transport Planner';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'MarudhamX routes perishable agricultural shipments along real road networks and calculates exact truck requirements.');
    }
  }
}

updatePageMetadata(i18n.language);

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('marudhamx_lang', lng);
  updatePageMetadata(lng);
});

export const formatCurrency = (amount: number, locale = i18n.language): string => {
  try {
    const loc = locale === 'ta' ? 'ta-IN' : locale === 'hi' ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString()}`;
  }
};

export const formatNumber = (num: number, locale = i18n.language): string => {
  try {
    const loc = locale === 'ta' ? 'ta-IN' : locale === 'hi' ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(loc).format(num);
  } catch {
    return num.toLocaleString();
  }
};

export const formatLocalizedDateTime = (isoString: string, locale = i18n.language): string => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const loc = locale === 'ta' ? 'ta-IN' : locale === 'hi' ? 'hi-IN' : 'en-IN';
    return new Intl.DateTimeFormat(loc, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return isoString;
  }
};

export const getLocalizedRouteLetter = (routeId: string, locale = i18n.language): string => {
  if (locale === 'ta' || locale === 'hi') {
    const map: Record<string, string> = {
      A: '1',
      B: '2',
      C: '3',
      D: '4',
      E: '5'
    };
    return map[routeId] || routeId;
  }
  return routeId;
};

export default i18n;
