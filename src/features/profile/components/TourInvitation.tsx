import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import "./TourInvitation.scss";

type Props = {
  onStart: () => void;
  onLater: () => void;
  onDismiss: () => void;
};

export default function TourInvitation({ onStart, onLater, onDismiss }: Props) {
  const { t } = useTranslation();
  return createPortal(
    <div className="tour-invitation">
      <div className="tour-invitation__card">
        <span className="tour-invitation__icon">👋</span>
        <div className="tour-invitation__content">
          <p className="tour-invitation__title">
            {t("tour.invitation.title")}
          </p>
          <p className="tour-invitation__subtitle">
            {t("tour.invitation.subtitle")}
          </p>
        </div>
        <div className="tour-invitation__actions">
          <button
            className="btn-primary tour-invitation__btn"
            onClick={onStart}
            type="button"
          >
            {t("tour.invitation.showMe")}
          </button>
          <button
            className="tour-invitation__link"
            onClick={onLater}
            type="button"
          >
            {t("tour.invitation.later")}
          </button>
          <button
            className="tour-invitation__link tour-invitation__link--muted"
            onClick={onDismiss}
            type="button"
          >
            {t("tour.invitation.dontShowAgain")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
