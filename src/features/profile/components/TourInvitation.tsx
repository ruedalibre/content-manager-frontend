import { createPortal } from "react-dom";
import "./TourInvitation.scss";

type Props = {
  onStart: () => void;
  onLater: () => void;
  onDismiss: () => void;
};

export default function TourInvitation({ onStart, onLater, onDismiss }: Props) {
  return createPortal(
    <div className="tour-invitation">
      <div className="tour-invitation__card">
        <span className="tour-invitation__icon">👋</span>
        <div className="tour-invitation__content">
          <p className="tour-invitation__title">
            Quick tour of the platform?
          </p>
          <p className="tour-invitation__subtitle">
            We'll show you the 4 key sections in under a minute.
          </p>
        </div>
        <div className="tour-invitation__actions">
          <button
            className="btn-primary tour-invitation__btn"
            onClick={onStart}
            type="button"
          >
            Show me →
          </button>
          <button
            className="tour-invitation__link"
            onClick={onLater}
            type="button"
          >
            Later
          </button>
          <button
            className="tour-invitation__link tour-invitation__link--muted"
            onClick={onDismiss}
            type="button"
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
