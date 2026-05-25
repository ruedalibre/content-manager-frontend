import { useTranslation } from "react-i18next";
import "./UpgradePrompt.scss";

type Props = {
  title: string;
  description: string;
  compact?: boolean;
};

export default function UpgradePrompt({ title, description, compact = false }: Props) {
  const { t } = useTranslation();

  return (
    <div className={`upgrade-prompt ${compact ? "upgrade-prompt--compact" : ""}`}>
      <div className="upgrade-prompt__lock" aria-hidden="true">✦</div>
      <div className="upgrade-prompt__content">
        <p className="upgrade-prompt__title">{title}</p>
        <p className="upgrade-prompt__desc">{description}</p>
      </div>
      <button
        className="upgrade-prompt__cta btn-primary"
        type="button"
        onClick={() => {
          // Por ahora scroll al top — en el paso 3 navegará a /pricing
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        {t("upgrade.cta")}
      </button>
    </div>
  );
}
