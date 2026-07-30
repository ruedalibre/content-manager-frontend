import { useTranslation } from "react-i18next";
import { useSubscription } from "../../features/subscription/hooks/useSubscription.tsx";
import { useCheckout } from "../../features/subscription/hooks/useCheckout.ts";
import "./PastDueBanner.scss";

export default function PastDueBanner() {
  const { t } = useTranslation();
  const { subscription } = useSubscription();
  const { openPortal, loading } = useCheckout();

  if (subscription.status !== "past_due") return null;

  return (
    <div className="past-due-banner" role="alert">
      <div className="past-due-banner__content">
        <span className="past-due-banner__icon" aria-hidden="true">
          ⚠️
        </span>
        <p className="past-due-banner__text">{t("billing.pastDueMessage")}</p>
      </div>
      <button
        className="past-due-banner__cta"
        type="button"
        onClick={openPortal}
        disabled={loading}
      >
        {loading ? t("common.loading") : t("billing.pastDueCta")}
      </button>
    </div>
  );
}
