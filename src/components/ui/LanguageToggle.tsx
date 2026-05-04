import { useTranslation } from "react-i18next";
import "./LanguageToggle.scss";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("es") ? "es" : "en";

  const toggle = (lang: "en" | "es") => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="lang-toggle">
      <button
        type="button"
        className={`lang-toggle__btn ${current === "en" ? "lang-toggle__btn--active" : ""}`}
        onClick={() => toggle("en")}
      >
        EN
      </button>
      <span className="lang-toggle__divider">|</span>
      <button
        type="button"
        className={`lang-toggle__btn ${current === "es" ? "lang-toggle__btn--active" : ""}`}
        onClick={() => toggle("es")}
      >
        ES
      </button>
    </div>
  );
}
