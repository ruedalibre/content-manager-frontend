import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../supabaseClient.ts";
import LanguageToggle from "../../components/ui/LanguageToggle.tsx";
import "./Login.scss";
import backgroundImage from "../../assets/login-background.jpg";

type Mode = "signin" | "register" | "forgot";

const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

function getPasswordRequirements(password: string) {
  return [
    { key: "passwordReq8chars", met: password.length >= 8 },
    { key: "passwordReqUppercase", met: /[A-Z]/.test(password) },
    { key: "passwordReqNumber", met: /[0-9]/.test(password) },
    { key: "passwordReqSpecial", met: /[!@#$%^&*]/.test(password) },
  ];
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("email") ? "register" : "signin",
  );
  const [email, setEmail] = useState(() => {
    const emailParam = searchParams.get("email");
    return emailParam ? decodeURIComponent(emailParam) : "";
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) navigate("/ideas");
    };
    checkSession();
  }, [navigate]);

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    resetForm();
  };

  /* SIGN IN */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(t("login.errors.invalidCredentials"));
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("requires_password_update")
        .eq("user_id", user.id)
        .single();

      if (profile?.requires_password_update) {
        navigate("/update-password");
        return;
      }
    }

    navigate("/ideas");
  };

  /* REGISTER */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError(t("login.errors.passwordMismatch"));
      setLoading(false);
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError(t("login.errors.passwordWeak"));
      setLoading(false);
      return;
    }

    try {
      const checkRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-invitation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        },
      );

      const checkData = await checkRes.json();

      if (!checkData.invited) {
        if (checkData.reason === "pending") {
          setError(t("login.errors.pendingInvite"));
        } else {
          setError(t("login.errors.notInvited"));
        }
        setLoading(false);
        return;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        { email, password },
      );

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError(t("login.errors.generic"));
        setLoading(false);
        return;
      }

      // Sign out immediately so user goes through signin flow
      await supabase.auth.signOut();

      // Show success and switch to signin
      setSuccess(t("login.accountCreated"));
      setPassword("");
      setConfirmPassword("");
      setLoading(false);

      setTimeout(() => {
        switchMode("signin");
      }, 2000);
    } catch {
      setError(t("login.errors.generic"));
      setLoading(false);
    }
  };

  /* FORGOT PASSWORD */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // DESPUÉS
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken: undefined,
    });

    if (error) {
      setError(t("login.errors.resetFailed"));
      setLoading(false);
      return;
    }

    setSuccess(t("login.resetEmailSent"));
    setLoading(false);
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
          <span className="login-panel__name">Creadora</span>
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
          x1="16"
          y1="0"
          x2="20"
          y2="100"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
        />
      </svg>

      {/* RIGHT PANEL */}
      <div className="login-panel login-panel--right">
        <div className="login-card">
          {/* DYNAMIC HEADER */}
          <div className="login-header">
            <h1 className="login-title">
              {mode === "signin"
                ? t("login.welcomeBack")
                : mode === "register"
                  ? t("login.welcomeNew")
                  : t("login.forgotTitle")}
            </h1>
            <p className="login-subtitle">
              {mode === "signin"
                ? t("login.welcomeBackSub")
                : mode === "register"
                  ? t("login.welcomeNewSub")
                  : t("login.forgotSub")}
            </p>
          </div>

          {/* MODE TOGGLE — hidden in forgot mode */}
          {mode !== "forgot" && (
            <div className="login-toggle">
              <button
                type="button"
                className={`login-toggle__btn${mode === "signin" ? " login-toggle__btn--active" : ""}`}
                onClick={() => switchMode("signin")}
              >
                {t("login.signIn")}
              </button>
              <button
                type="button"
                className={`login-toggle__btn${mode === "register" ? " login-toggle__btn--active" : ""}`}
                onClick={() => switchMode("register")}
              >
                {t("login.createAccount")}
              </button>
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={
              mode === "signin"
                ? handleSignIn
                : mode === "register"
                  ? handleRegister
                  : handleForgotPassword
            }
            className="login-form"
          >
            <div className="login-form__field">
              <label className="login-form__label">
                {t("login.emailPlaceholder")}
              </label>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div
              className="login-form__field"
              style={{ display: mode === "forgot" ? "none" : undefined }}
            >
              <label className="login-form__label">
                {t("login.passwordPlaceholder")}
              </label>
              <div className="login-form__input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  required={mode !== "forgot"}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                />
                {mode !== "forgot" && (
                  <button
                    type="button"
                    className="login-form__eye"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
              {mode === "signin" && (
                <button
                  type="button"
                  className="login-form__forgot"
                  onClick={() => switchMode("forgot")}
                >
                  {t("login.forgotPassword")}
                </button>
              )}
              {mode === "register" && passwordTouched && (
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

            {mode === "register" && (
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
                    {showConfirmPassword ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="login-error">{error}</p>}
            {success && <p className="login-success">{success}</p>}

            <button
              type="submit"
              className="btn-primary login-submit"
              disabled={loading}
            >
              {loading
                ? mode === "signin"
                  ? t("login.signingIn")
                  : mode === "register"
                    ? t("login.creatingAccount")
                    : t("login.sendingReset")
                : mode === "signin"
                  ? t("login.signIn")
                  : mode === "register"
                    ? t("login.createAccount")
                    : t("login.sendReset")}
            </button>

            {mode === "forgot" && (
              <button
                type="button"
                className="login-form__back-link"
                onClick={() => switchMode("signin")}
              >
                ← {t("login.backToSignIn")}
              </button>
            )}
          </form>

          {/* FOOTER */}
          <div className="login-footer">
            <a href="https://content-intel.app" className="login-back">
              {t("login.backToLanding")}
            </a>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
