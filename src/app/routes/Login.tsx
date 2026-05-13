import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { supabase } from "../../supabaseClient"
import LanguageToggle from "../../components/ui/LanguageToggle"
import "./Login.scss"

type Mode = "signin" | "register"

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("email") ? "register" : "signin"
  )
  const [email, setEmail] = useState(() => {
    const emailParam = searchParams.get("email")
    return emailParam ? decodeURIComponent(emailParam) : ""
  })
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) navigate("/activity")
    }
    checkSession()
  }, [navigate])

  const resetForm = () => {
    setPassword("")
    setConfirmPassword("")
    setError(null)
    setSuccess(null)
  }

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    resetForm()
  }

  /* SIGN IN */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(t("login.errors.invalidCredentials"))
      setLoading(false)
      return
    }

    navigate("/activity")
  }

  /* REGISTER */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError(t("login.errors.passwordMismatch"))
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError(t("login.errors.passwordTooShort"))
      setLoading(false)
      return
    }

    try {
      const checkRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-invitation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      )

      const checkData = await checkRes.json()

      if (!checkData.invited) {
        if (checkData.reason === "pending") {
          setError(t("login.errors.pendingInvite"))
        } else {
          setError(t("login.errors.notInvited"))
        }
        setLoading(false)
        return
      }

      const { data: authData, error: signUpError } =
        await supabase.auth.signUp({ email, password })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError(t("login.errors.generic"))
        setLoading(false)
        return
      }

      // Sign out immediately so user goes through signin flow
      await supabase.auth.signOut()

      // Show success and switch to signin
      setSuccess(t("login.accountCreated"))
      setPassword("")
      setConfirmPassword("")
      setLoading(false)

      setTimeout(() => {
        switchMode("signin")
      }, 2000)

    } catch {
      setError(t("login.errors.generic"))
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      {/* LEFT PANEL */}
      <div className="login-panel login-panel--left">
        <div className="login-panel__brand">
          <span className="login-panel__logo">✦</span>
          <span className="login-panel__name">
            Content Intelligence App
          </span>
        </div>

        <div className="login-panel__copy">
          <h2 className="login-panel__tagline">
            {t("login.tagline")}
          </h2>
          <p className="login-panel__sub">
            {t("login.taglineSub")}
          </p>
        </div>

        <p className="login-panel__quote">
          "{t("login.quote")}"
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-panel login-panel--right">
        <div className="login-card">

          {/* DYNAMIC HEADER */}
          <div className="login-header">
            <h1 className="login-title">
              {mode === "signin"
                ? t("login.welcomeBack")
                : t("login.welcomeNew")}
            </h1>
            <p className="login-subtitle">
              {mode === "signin"
                ? t("login.welcomeBackSub")
                : t("login.welcomeNewSub")}
            </p>
          </div>

          {/* MODE TOGGLE */}
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

          {/* FORM */}
          <form
            onSubmit={mode === "signin" ? handleSignIn : handleRegister}
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

            <div className="login-form__field">
              <label className="login-form__label">
                {t("login.passwordPlaceholder")}
              </label>
              <input
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {mode === "register" && (
              <div className="login-form__field">
                <label className="login-form__label">
                  {t("login.confirmPasswordPlaceholder")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {error && (
              <p className="login-error">{error}</p>
            )}
            {success && (
              <p className="login-success">{success}</p>
            )}

            <button
              type="submit"
              className="btn-primary login-submit"
              disabled={loading}
            >
              {loading
                ? mode === "signin"
                  ? t("login.signingIn")
                  : t("login.creatingAccount")
                : mode === "signin"
                  ? t("login.signIn")
                  : t("login.createAccount")}
            </button>
          </form>

          {/* FOOTER */}
          <div className="login-footer">
            <a
              href="https://content-intel.app"
              className="login-back"
            >
              {t("login.backToLanding")}
            </a>
            <LanguageToggle />
          </div>

        </div>
      </div>
    </div>
  )
}
