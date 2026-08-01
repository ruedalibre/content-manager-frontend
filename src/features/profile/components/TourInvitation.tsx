import { useTranslation } from "react-i18next";
import "./TourInvitation.scss";
import { Hand } from "lucide-react";

type Props = {
  onStart: () => void;
  onLater: () => void;
  onDismiss: () => void;
};

export default function TourInvitation({ onStart, onLater, onDismiss }: Props) {
  const { t } = useTranslation();
  return (
    <div className="tour-invitation-overlay" aria-modal="true" role="dialog">
      <div className="tour-invitation">
        <Hand size={40} className="tour-invitation__emoji" aria-hidden="true" />
        <h2 className="tour-invitation__title">
          {t("tour.invitation.title")}
        </h2>
        <p className="tour-invitation__subtitle">
          {t("tour.invitation.subtitle")}
        </p>
        <button
          className="btn-primary tour-invitation__cta"
          onClick={onStart}
          type="button"
        >
          {t("tour.invitation.showMe")}
        </button>
        <button
          className="btn-secondary tour-invitation__later"
          onClick={onLater}
          type="button"
        >
          {t("tour.invitation.later")}
        </button>
        <hr className="tour-invitation__divider" />
        <button
          className="tour-invitation__dismiss"
          onClick={onDismiss}
          type="button"
        >
          {t("tour.invitation.dontShowAgain")}
        </button>
      </div>
    </div>
  );
}
