import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { supabase } from "../../supabaseClient"
import "./Login.scss"

export default function ResetPassword() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    // Supabase procesa el hash automáticamente y emite PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setValidSession(true)
        } else if (event === "SIGNED_IN" && session) {
          // También válido si ya hay sesión activa del link
          setValidSession(true)
        }
      }
    )

    // Fallback: verificar sesión existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true)
    })

    // Si tras 3 s no hay sesión válida, mostrar error de link expirado
    const timeout = setTimeout(() => {
      setValidSession((prev) => {
        if (!prev) setError(t("login.errors.resetLinkExpired"))
        return prev
      })
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t("login.errors.passwordMismatch"))
      return
    }

    if (password.length < 8) {
      setError(t("login.errors.passwordTooShort"))
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(t("login.errors.resetFailed"))
      setLoading(false)
      return
    }

    setSuccess(t("login.passwordUpdated"))
    setLoading(false)

    setTimeout(() => navigate("/activity"), 2000)
  }

  return (
    <div className="login-page">
      <div className="login-panel login-panel--left">
        <svg className="login-panel__circles-svg" aria-hidden="true" focusable="false">
          <circle cx="75%" cy="60%" r="170" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <circle cx="25%" cy="25%" r="280" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <circle cx="55%" cy="85%" r="310" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </svg>
        <div className="login-panel__brand">
          <span className="login-panel__logo">✦</span>
          <span className="login-panel__name">Content Intelligence App</span>
        </div>
        <div className="login-panel__copy">
          <h2 className="login-panel__tagline">{t("login.tagline")}</h2>
          <p className="login-panel__sub">{t("login.taglineSub")}</p>
        </div>
      </div>

      <svg className="login-divider-svg" aria-hidden="true" focusable="false" viewBox="0 0 40 100" preserveAspectRatio="none">
        <line x1="16" y1="0" x2="20" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
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
                <input
                  type="password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
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

              {error && <p className="login-error">{error}</p>}
              {success && <p className="login-success">{success}</p>}

              <button
                type="submit"
                className="btn-primary login-submit"
                disabled={loading}
              >
                {loading ? t("login.updatingPassword") : t("login.updatePassword")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
