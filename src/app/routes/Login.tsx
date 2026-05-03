import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./Login.scss";

type Mode = "signin" | "register";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Si ya hay sesión activa → redirigir
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/activity");
    };
    checkSession();
  }, [navigate]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    resetForm();
  };

  /* =========================
     SIGN IN
  ========================= */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    navigate("/activity");
  };

  /* =========================
     REGISTER
  ========================= */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar contraseñas
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      // 1. Verificar invitación
      const checkRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-invitation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );

      const checkData = await checkRes.json();

      if (!checkData.invited) {
        if (checkData.reason === "pending") {
          setError(
            "Your email is on the waitlist but hasn't been invited yet. We'll notify you when your access is ready."
          );
        } else {
          setError(
            "This email hasn't been invited yet. Join the waitlist at content-intel.app"
          );
        }
        setLoading(false);
        return;
      }

      // 2. Crear cuenta en Supabase Auth
      const { data: authData, error: signUpError } =
        await supabase.auth.signUp({ email, password });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // 3. Navegar — el onboarding aparecerá automáticamente
      //    vía WelcomeScreen en AppLayout
      navigate("/activity");

    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="login-page">
      <div className="login-card">

        {/* HEADER */}
        <div className="login-header">
          <span className="login-logo">✦</span>
          <h1 className="login-title">Content Intelligence</h1>
          <p className="login-subtitle">
            Your creative process, systematized.
          </p>
        </div>

        {/* MODE TOGGLE */}
        <div className="login-toggle">
          <button
            type="button"
            className={`login-toggle__btn ${mode === "signin" ? "login-toggle__btn--active" : ""}`}
            onClick={() => switchMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`login-toggle__btn ${mode === "register" ? "login-toggle__btn--active" : ""}`}
            onClick={() => switchMode("register")}
          >
            Create account
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={mode === "signin" ? handleSignIn : handleRegister}
          className="login-form"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          {mode === "register" && (
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}

          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}

          <button
            type="submit"
            className="btn-primary login-submit"
            disabled={loading}
          >
            {loading
              ? mode === "signin" ? "Signing in..." : "Creating account..."
              : mode === "signin" ? "Sign in" : "Create account"
            }
          </button>
        </form>

        {/* BACK TO LANDING */}
        <a
          href="https://content-intel.app"
          className="login-back"
        >
          ← Back to content-intel.app
        </a>

      </div>
    </div>
  );
}
