import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../supabaseClient.ts";
import LanguageToggle from "../../components/ui/LanguageToggle.tsx";
import backgroundImage from "../../assets/login-background.jpg";
import "./Login.scss";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

function getPasswordRequirements(password: string) {
  return [
    { key: "passwordReq8chars",    met: password.length >= 8 },
    { key: "passwordReqUppercase", met: /[A-Z]/.test(password) },
    { key: "passwordReqNumber",    met: /[0-9]/.test(password) },
    { key: "passwordReqSpecial",   met: /[!@#$%^&*]/.test(password) },
  ];
}

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("login.errors.passwordMismatch"));
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError(t("login.errors.passwordWeak"));
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_profiles")
          .update({ requires_password_update: false })
          .eq("user_id", user.id);
      }

      setSuccess(t("login.passwordUpdateSuccess"));
      setTimeout(() => navigate("/ideas"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT PANEL */}
      <div className="login-panel login-panel--left">
        <div
          className="login-panel__hero-bg"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="login-panel__hero-overlay" />
        <div className="login-panel__brand">
          <span className="login-panel__logo">✦</span>
          <span className="login-panel__name">Content Intelligence App</span>
        </div>
        <div className="login-panel__copy">
          <h2 className="login-panel__tagline">{t("login.tagline")}</h2>
          <p className="login-panel__sub">{t("login.taglineSub")}</p>
        </div>
        <p className="login-panel__quote">"{t("login.quote")}"</p>
      </div>

      {/* DIAGONAL DIVIDER */}
      <svg
        className="login-divider-svg"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 40 100"
        preserveAspectRatio="none"
      >
        <line
          x1="16" y1="0" x2="20" y2="100"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
        />
      </svg>

      {/* RIGHT PANEL */}
      <div className="login-panel login-panel--right">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">{t("login.updatePasswordTitle")}</h1>
            <p className="login-subtitle">{t("login.updatePasswordSub")}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {/* NUEVA CONTRASEÑA */}
            <div className="login-form__field">
              <label className="login-form__label">
                {t("login.newPassword")}
              </label>
              <div className="login-form__input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                />
                <button
                  type="button"
                  className="login-form__eye"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordTouched && (
                <div className="login-form__password-requirements">
                  <span className="login-form__password-requirements__title">
                    {t("login.passwordRequirementsTitle")}
                  </span>
                  {getPasswordRequirements(password).map((req) => (
                    <span
                      key={req.key}
                      className={`login-form__password-req ${req.met ? "login-form__password-req--met" : ""}`}
                    >
                      {req.met ? "✓" : "✗"} {t(`login.${req.key}`)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CONFIRMAR CONTRASEÑA */}
            <div className="login-form__field">
              <label className="login-form__label">
                {t("login.confirmPasswordPlaceholder")}
              </label>
              <div className="login-form__input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-form__eye"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}
            {success && <p className="login-success">{success}</p>}

            <button
              type="submit"
              className="btn-primary login-submit"
              disabled={loading}
            >
              {loading ? t("login.updatingPasswordBtn") : t("login.updatePasswordBtn")}
            </button>
          </form>

          <div className="login-footer">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
