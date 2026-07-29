import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "../../styles/modals.scss";

type Props = {
  secondsLeft: number;
  onStayActive: () => void;
};

export default function IdleWarningModal({ secondsLeft, onStayActive }: Props) {
  const { t } = useTranslation();

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const content = (
    <div className="modal-overlay">
      <div className="modal modal--confirm">
        <h3>{t("session.idleWarningTitle")}</h3>
        <p>{t("session.idleWarningBody")}</p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-24)", textAlign: "center" }}>
          {formatted}
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-primary" onClick={onStayActive}>
            {t("session.stayActive")}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}