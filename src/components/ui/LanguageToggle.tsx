import "./LanguageToggle.scss";

type Props = {
  value: "en" | "es";
  onChange: (lang: "en" | "es") => void;
};

export default function LanguageToggle({ value, onChange }: Props) {
  return (
    <div className="lang-toggle">
      <button
        type="button"
        className={`lang-toggle__btn ${value === "en" ? "lang-toggle__btn--active" : ""}`}
        onClick={() => onChange("en")}
      >
        EN
      </button>
      <span className="lang-toggle__divider">|</span>
      <button
        type="button"
        className={`lang-toggle__btn ${value === "es" ? "lang-toggle__btn--active" : ""}`}
        onClick={() => onChange("es")}
      >
        ES
      </button>
    </div>
  );
}
