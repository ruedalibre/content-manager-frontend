import { useTranslation } from "react-i18next";
import { usePricingModal } from "../context/PricingModalContext";
import "./PricingModal.scss";

export default function PricingModal() {
  const { t } = useTranslation();
  const { isOpen, close } = usePricingModal();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={close}>
      <div
        className="pricing-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-modal-title"
      >
        {/* Header */}
        <div className="pricing-modal__header">
          <div>
            <h3 id="pricing-modal-title" className="pricing-modal__title">
              {t("pricing.title")}
            </h3>
            <p className="pricing-modal__subtitle">{t("pricing.subtitle")}</p>
          </div>
          <button
            className="pricing-modal__close"
            onClick={close}
            type="button"
            aria-label={t("common.close")}
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        {/* Plans grid */}
        <div className="pricing-modal__plans">

          {/* FREE */}
          <div className="pricing-plan">
            <span className="pricing-plan__badge pricing-plan__badge--spacer">·</span>
            <p className="pricing-plan__name">{t("pricing.free")}</p>
            <p className="pricing-plan__price">
              $0
            </p>
            <div className="pricing-plan__sub">
              <span>{t("pricing.freeSub")}</span>
            </div>
            <button className="pricing-plan__cta" type="button" disabled>
              {t("pricing.currentPlan")}
            </button>
            <p className="pricing-plan__features-label">{t("pricing.includes")}</p>
            <ul className="pricing-plan__features">
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.ideas10")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.contentsUnlimited")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.dashboard")}
              </li>
              <li className="pricing-feature pricing-feature--locked">
                <i className="ti ti-lock" aria-hidden="true" />
                {t("pricing.feature.briefsTrial")}
              </li>
              <li className="pricing-feature pricing-feature--locked">
                <i className="ti ti-lock" aria-hidden="true" />
                {t("pricing.feature.dnaBasic")}
              </li>
              <li className="pricing-feature pricing-feature--locked">
                <i className="ti ti-lock" aria-hidden="true" />
                {t("pricing.feature.insightsAI")}
              </li>
              <li className="pricing-feature pricing-feature--locked">
                <i className="ti ti-lock" aria-hidden="true" />
                {t("pricing.feature.report")}
              </li>
              <li className="pricing-feature pricing-feature--locked">
                <i className="ti ti-lock" aria-hidden="true" />
                {t("pricing.feature.ideaGenerator")}
              </li>
            </ul>
          </div>

          {/* CREATOR MENSUAL */}
          <div className="pricing-plan pricing-plan--featured">
            <span className="pricing-plan__badge pricing-plan__badge--flexible">
              {t("pricing.flexible")}
            </span>
            <p className="pricing-plan__name">{t("pricing.creatorMonthly")}</p>
            <p className="pricing-plan__price">
              $12 <span>{t("pricing.perMonth")}</span>
            </p>
            <div className="pricing-plan__sub">
              <span>{t("pricing.monthlySub")}</span>
            </div>
            <button className="pricing-plan__cta pricing-plan__cta--primary" type="button">
              {t("pricing.trialCta")}
            </button>
            <p className="pricing-plan__features-label">{t("pricing.everythingFree")}</p>
            <ul className="pricing-plan__features">
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.ideasUnlimited")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.contentsUnlimited")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.dashboard")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.briefsUnlimited")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.dnaFull")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.insightsAI")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.report")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.ideaGenerator")}
              </li>
            </ul>
          </div>

          {/* CREATOR ANUAL */}
          <div className="pricing-plan pricing-plan--featured">
            <span className="pricing-plan__badge pricing-plan__badge--recommended">
              {t("pricing.recommended")}
            </span>
            <p className="pricing-plan__name">{t("pricing.creatorAnnual")}</p>
            <div className="pricing-plan__price-row">
              <p className="pricing-plan__price">
                $79 <span>{t("pricing.perYear")}</span>
              </p>
              <span className="pricing-plan__original">$99</span>
            </div>
            <div className="pricing-plan__sub">
              <span className="pricing-plan__sub--saving">{t("pricing.annualSaving")}</span>
              <span className="pricing-plan__sub--launch">{t("pricing.launchPrice")}</span>
            </div>
            <button className="pricing-plan__cta pricing-plan__cta--accent" type="button">
              {t("pricing.trialCta")}
            </button>
            <p className="pricing-plan__features-label">{t("pricing.everythingFree")}</p>
            <ul className="pricing-plan__features">
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.ideasUnlimited")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.contentsUnlimited")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.dashboard")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.briefsUnlimited")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.dnaFull")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.insightsAI")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.report")}
              </li>
              <li className="pricing-feature pricing-feature--included">
                <i className="ti ti-check" aria-hidden="true" />
                {t("pricing.feature.ideaGenerator")}
              </li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="pricing-modal__footer">
          <i className="ti ti-shield-check" aria-hidden="true" />
          {t("pricing.footer")}
        </div>

      </div>
    </div>
  );
}
