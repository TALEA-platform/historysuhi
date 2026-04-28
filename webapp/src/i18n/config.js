export const DEFAULT_LANGUAGE = "it";

export function normalizeLanguage(value) {
  return value === "en" ? "en" : DEFAULT_LANGUAGE;
}

export function readStoredLanguage() {
  try {
    const stored = window.localStorage.getItem("talea:language");
    return stored ? normalizeLanguage(stored) : null;
  } catch {
    return null;
  }
}

export function persistLanguage(language) {
  try {
    window.localStorage.setItem("talea:language", normalizeLanguage(language));
  } catch {
    // Ignore storage failures and keep the in-memory preference.
  }
}