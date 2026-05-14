export const locales = [
  "en",
  "es",
  "uk",
  "ru",
  "pl",
  "de",
  "ja",
  "fr",
  "it",
  "zh",
  "hi",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  uk: "Українська",
  ru: "Русский",
  pl: "Polski",
  de: "Deutsch",
  ja: "日本語",
  fr: "Français",
  it: "Italiano",
  zh: "中文",
  hi: "हिन्दी",
};

export const LOCALE_COOKIE = "POWERINSIDE_LOCALE";

export function pickLocale(input: string | null | undefined): Locale {
  if (!input) return defaultLocale;
  const lower = input.toLowerCase();
  for (const loc of locales) {
    if (lower === loc || lower.startsWith(loc + "-") || lower.startsWith(loc + "_")) {
      return loc;
    }
  }
  return defaultLocale;
}

export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;
  const candidates = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...rest] = part.trim().split(";");
      const qMatch = rest.find((r) => r.trim().startsWith("q="));
      const q = qMatch ? parseFloat(qMatch.split("=")[1]) : 1;
      return { tag: tag.trim(), q: isNaN(q) ? 0 : q };
    })
    .sort((a, b) => b.q - a.q);

  for (const c of candidates) {
    const matched = pickLocale(c.tag);
    if (matched !== defaultLocale || c.tag.toLowerCase().startsWith("en")) {
      return matched;
    }
  }
  return defaultLocale;
}
