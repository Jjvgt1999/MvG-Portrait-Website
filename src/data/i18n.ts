export type Locale = 'de' | 'en';
export const LOCALES: Locale[] = ['de', 'en'];

/**
 * A piece of text in one or more languages.
 * A plain string is treated as English (the current draft language).
 */
export type Localized = string | Partial<Record<Locale, string>>;

const DEFAULT_LOCALE: Locale = 'en';

function readParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function detectLocale(): Locale {
  const lang = readParams().get('lang');
  return lang === 'de' || lang === 'en' ? lang : DEFAULT_LOCALE;
}

/** Active locale, chosen with ?lang=de or ?lang=en. */
export const locale: Locale = detectLocale();

/** Review mode (?review) marks passages whose source is not yet verified. */
export const reviewMode: boolean = readParams().has('review') || import.meta.env.VITE_REVIEW === '1';

/** Resolve a Localized value; falls back to the other language when missing. */
export function resolveText(value: Localized, loc: Locale = locale): string {
  if (typeof value === 'string') return value;
  return value[loc] ?? value.en ?? value.de ?? '';
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = locale;
}
