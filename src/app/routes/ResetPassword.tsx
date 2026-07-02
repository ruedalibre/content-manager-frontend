import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../supabaseClient";
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

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validSession, setValidSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    const processToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      console.log("[ResetPassword] tokenHash:", tokenHash);
      console.log("[ResetPassword] type:", type);

      if (tokenHash && type === "recovery") {
        console.log("[ResetPassword] Calling verifyOtp...");

        const result = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        console.log("[ResetPassword] verifyOtp result:", result);

        if (!result.error) {
          setValidSession(true);
          window.history.replaceState(null, "", window.location.pathname);
          return;
        } else {
          setError(t("login.errors.resetLinkExpired"));
          return;
        }
      }

      console.log("[ResetPassword] Fallback to session check");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("[ResetPassword] Session:", session);

      if (session) {
        setValidSession(true);
        return;
      }

      setTimeout(() => {
        setValidSession((prev) => {
          if (!prev) setError(t("login.errors.resetLinkExpired"));
          return prev;
        });
      }, 3000);
    };

    processToken();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(t("login.errors.resetFailed"));
      setLoading(false);
      return;
    }

    setSuccess(t("login.passwordUpdated"));
    setLoading(false);

    setTimeout(() => navigate("/ideas"), 2000);
  };

  return (
    <div className="login-page">
      <div className="login-panel login-panel--left">
        <svg
          className="login-panel__circles-svg"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="75%"
            cy="60%"
            r="170"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
          <circle
            cx="25%"
            cy="25%"
            r="280"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          <circle
            cx="55%"
            cy="85%"
            r="310"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        </svg>
        <div className="login-panel__brand">
          <span className="login-panel__logo">✦</span>
          <span className="login-panel__name">Creadora</span>
        </div>
        <div className="login-panel__copy">
          <h2 className="login-panel__tagline">{t("login.tagline")}</h2>
          <p className="login-panel__sub">{t("login.taglineSub")}</p>
        </div>
      </div>

      <svg
        className="login-divider-svg"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 40 100"
        preserveAspectRatio="none"
      >
        <line
          x1="16"
          y1="0"
          x2="20"
          y2="100"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
        />
      </svg>

      <div className="login-panel login-panel--right">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">{t("login.resetTitle")}</h1>
            <p className="login-subtitle">{t("login.resetSub")}</p>
          </div>

          {!validSession ? (
            <p className="login-error">{error}</p>
          ) : (
            <form onSubmit={handleReset} className="login-form">
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
                {loading
                  ? t("login.updatingPassword")
                  : t("login.updatePassword")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
