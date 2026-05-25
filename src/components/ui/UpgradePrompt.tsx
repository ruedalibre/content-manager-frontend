import { useTranslation } from "react-i18next";
import { usePricingModal } from "../../features/subscription/context/PricingModalContext.tsx";
import "./UpgradePrompt.scss";

type Props = {
  title: string;
  description: string;
  compact?: boolean;
};

export default function UpgradePrompt({ title, description, compact = false }: Props) {
  const { t } = useTranslation();
  const { open } = usePricingModal();

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
        onClick={open}
      >
        {t("upgrade.cta")}
      </button>
    </div>
  );
}
