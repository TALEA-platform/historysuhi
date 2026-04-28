import { useAppStore } from "../store/appStore.js";
import { normalizeLanguage } from "./config.js";
import { getLocalizedData } from "./localizedData.js";

export function useI18n() {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const normalizedLanguage = normalizeLanguage(language);

  return {
    language: normalizedLanguage,
    setLanguage,
    data: getLocalizedData(normalizedLanguage),
  };
}