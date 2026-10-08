import en from "./locales/en.js";
import uk from "./locales/uk.js";
import ru from "./locales/ru.js";
export const languages = Object.freeze({
  en: "EN",
  uk: "UA",
  ru: "RU",
});
export const catalogs = Object.freeze({
  en,
  uk,
  ru,
});
const preferenceKey = "juristree.language";
function preferredLanguage() {
  try {
    const saved = globalThis.localStorage?.getItem(preferenceKey);
    if (Object.hasOwn(languages, saved)) return saved;
  } catch {
    // Language selection remains usable when browser storage is blocked.
  }
  const browserLanguage = globalThis.navigator?.language?.split("-")[0];
  return Object.hasOwn(languages, browserLanguage) ? browserLanguage : "en";
}
let language = preferredLanguage();
export function getLanguage() {
  return language;
}
export function getLocale() {
  return {
    en: "en-US",
    uk: "uk-UA",
    ru: "ru-RU",
  }[language];
}

/** Resolve a message without translating interpolated user content. */
export function translate(key, values = {}) {
  const message = catalogs[language][key];
  if (typeof message !== "string")
    throw new Error(`Missing ${language} message: ${key}`);
  return message.replace(/\{(\w+)\}/g, (match, name) =>
    String(values[name] ?? match),
  );
}
export function setLanguage(next) {
  if (!Object.hasOwn(languages, next))
    throw new Error(`Unsupported language: ${next}`);
  language = next;
  try {
    globalThis.localStorage?.setItem(preferenceKey, next);
  } catch {
    // Preference persistence is optional; in-memory language changes still work.
  }
  if (globalThis.document) document.documentElement.lang = next;
}
