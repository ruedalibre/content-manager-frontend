import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "../../features/profile/hooks/useUserProfile";
import "./LanguageToggle.scss";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const { profile, updateLanguage } = useUserProfile();
  const current = i18n.language?.startsWith("es") ? "es" : "en";

  useEffect(() => {
    if (profile?.preferred_language) {
      i18n.changeLanguage(profile.preferred_language);
    }
  }, [profile?.preferred_language]);

  const toggle = async (lang: "en" | "es") => {
    i18n.changeLanguage(lang);
    await updateLanguage(lang);
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
