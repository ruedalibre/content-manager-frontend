import { UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../../features/profile/hooks/useUserProfile.tsx";

export default function ProfileNudge() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showProfileNudge, dismissProfileNudge } = useUserProfile();

  if (!showProfileNudge) return null;

  return (
    <div className="profile-nudge">
      <div className="profile-nudge__content">
        <UserCircle size={18} className="profile-nudge__icon" aria-hidden="true" />
        <div>
          <p className="profile-nudge__title">{t("profile.nudgeTitle")}</p>
          <p className="profile-nudge__text">{t("profile.nudgeText")}</p>
        </div>
      </div>
      <div className="profile-nudge__actions">
        <button
          className="btn-primary"
          onClick={() => navigate("/profile")}
          type="button"
          style={{ fontSize: "12px", padding: "5px 14px" }}
        >
          {t("profile.nudgeCta")}
        </button>
        <button
          className="btn-secondary"
          onClick={dismissProfileNudge}
          type="button"
          style={{ fontSize: "12px", padding: "5px 12px" }}
        >
          {t("profile.nudgeDismiss")}
        </button>
      </div>
    </div>
  );
}
