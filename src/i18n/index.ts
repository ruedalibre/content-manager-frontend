import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import en from "./en.json" with { type: "json" }
import es from "./es.json" with { type: "json" }
import enTerms from "./en/terms.json" with { type: "json" }
import esTerms from "./es/terms.json" with { type: "json" }
import enPrivacy from "./en/privacy.json" with { type: "json" }
import esPrivacy from "./es/privacy.json" with { type: "json" }

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en, terms: enTerms, privacy: enPrivacy },
      es: { translation: es, terms: esTerms, privacy: esPrivacy },
    },
    ns: ["translation", "terms", "privacy"],
    defaultNS: "translation",
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n