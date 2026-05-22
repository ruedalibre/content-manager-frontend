import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { useUserProfile } from "../../features/profile/hooks/useUserProfile";
import LanguageToggle from "../../components/ui/LanguageToggle.tsx";
import { supabase } from "../../supabaseClient";
import "./Profile.scss";

const COUNTRIES = [
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
  { code: "ES", name: "España" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Perú" },
  { code: "VE", name: "Venezuela" },
  { code: "EC", name: "Ecuador" },
  { code: "GT", name: "Guatemala" },
  { code: "CU", name: "Cuba" },
  { code: "BO", name: "Bolivia" },
  { code: "DO", name: "República Dominicana" },
  { code: "HN", name: "Honduras" },
  { code: "PY", name: "Paraguay" },
  { code: "SV", name: "El Salvador" },
  { code: "NI", name: "Nicaragua" },
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panamá" },
  { code: "UY", name: "Uruguay" },
  { code: "US", name: "Estados Unidos" },
  { code: "BR", name: "Brasil" },
  { code: "GB", name: "Reino Unido" },
  { code: "DE", name: "Alemania" },
  { code: "FR", name: "Francia" },
  { code: "IT", name: "Italia" },
  { code: "OTHER", name: "Otro" },
];

const TIMEZONES = [
  { value: "America/Bogota",                 label: "Bogotá, Lima, Quito (UTC−5)" },
  { value: "America/Mexico_City",            label: "Ciudad de México (UTC−6)" },
  { value: "America/Santiago",               label: "Santiago (UTC−4/−3)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (UTC−3)" },
  { value: "America/Caracas",                label: "Caracas (UTC−4)" },
  { value: "America/New_York",               label: "Nueva York (UTC−5/−4)" },
  { value: "America/Los_Angeles",            label: "Los Ángeles (UTC−8/−7)" },
  { value: "Europe/Madrid",                  label: "Madrid (UTC+1/+2)" },
  { value: "Europe/London",                  label: "Londres (UTC+0/+1)" },
  { value: "UTC",                            label: "UTC" },
];

const CREATOR_ROLES = [
  "educator", "entertainer", "journalist", "marketer",
  "storyteller", "analyst", "coach", "artist",
];

const TIME_OPTIONS = [
  "less_than_2h", "2_to_5h", "more_than_5h", "variable",
];

const SETUP_OPTIONS = ["solo", "small_team", "agency"];

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { setTopbarContext } = useOutletContext<{
    setTopbarContext: (v: string | null) => void;
    isAdmin: boolean;
  }>();

  useEffect(() => {
    setTopbarContext(t("profile.subtitle"));
    return () => setTopbarContext(null);
  }, [setTopbarContext, t]);

  const { profile, updateProfile, updateLanguage } = useUserProfile();

  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    display_name:       profile?.display_name ?? "",
    country_code:       profile?.country_code ?? "",
    timezone:           profile?.timezone ?? "America/Bogota",
    creator_role:       profile?.creator_role ?? "",
    preferred_language: profile?.preferred_language ?? "en",
    time_availability:  profile?.time_availability ?? "",
    production_setup:   profile?.production_setup ?? "",
    referents:          profile?.referents ?? "",
  });

  // Sincronizar form cuando el perfil carga
  useEffect(() => {
    if (!profile) return;
    setForm({
      display_name:       profile.display_name ?? "",
      country_code:       profile.country_code ?? "",
      timezone:           profile.timezone ?? "America/Bogota",
      creator_role:       profile.creator_role ?? "",
      preferred_language: profile.preferred_language ?? "en",
      time_availability:  profile.time_availability ?? "",
      production_setup:   profile.production_setup ?? "",
      referents:          profile.referents ?? "",
    });
  }, [profile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? "");
    });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (form.preferred_language !== profile?.preferred_language) {
        await updateLanguage(form.preferred_language as "en" | "es");
        i18n.changeLanguage(form.preferred_language);
      }
      await updateProfile({
        display_name:      form.display_name || null,
        country_code:      form.country_code || null,
        timezone:          form.timezone,
        creator_role:      form.creator_role || null,
        time_availability: form.time_availability || null,
        production_setup:  form.production_setup || null,
        referents:         form.referents || null,
      } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(t("common.failedUpdate"));
    } finally {
      setSaving(false);
    }
  };

  const completedFields = [
    form.display_name, form.country_code, form.creator_role,
    form.time_availability, form.production_setup, form.referents,
  ].filter(Boolean).length;
  const completionPct = Math.round((completedFields / 6) * 100);

  return (
    <div className="profile-page">
      {/* Completitud */}
      <div className="profile-completion">
        <div className="profile-completion__bar">
          <div
            className="profile-completion__fill"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <span className="profile-completion__label">
          {t("profile.completion", { pct: completionPct })}
        </span>
      </div>

      {/* Sección: Tu cuenta */}
      <section className="profile-section">
        <span className="section-label">{t("profile.accountSection")}</span>
        <div className="profile-card">
          <div className="profile-field profile-field--readonly">
            <span className="profile-field__label">{t("profile.email")}</span>
            <span className="profile-field__value">{email || "—"}</span>
          </div>
          <div className="profile-field profile-field--readonly">
            <span className="profile-field__label">{t("profile.memberSince")}</span>
            <span className="profile-field__value">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </div>
      </section>

      {/* Sección: Personalización */}
      <section className="profile-section">
        <span className="section-label">{t("profile.personalizationSection")}</span>
        <div className="profile-card">
          <div className="profile-field">
            <label className="profile-field__label">{t("profile.displayName")}</label>
            <input
              name="display_name"
              value={form.display_name}
              onChange={handleChange}
              placeholder={t("profile.displayNamePlaceholder")}
              className="profile-field__input"
            />
          </div>
          <div className="profile-field">
            <label className="profile-field__label">{t("profile.language")}</label>
            <div className="profile-field__language">
              <LanguageToggle />
            </div>
          </div>
          <div className="profile-field">
            <label className="profile-field__label">{t("profile.country")}</label>
            <select
              name="country_code"
              value={form.country_code}
              onChange={handleChange}
              className="profile-field__select"
            >
              <option value="">{t("profile.selectCountry")}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="profile-field">
            <label className="profile-field__label">{t("profile.timezone")}</label>
            <select
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
              className="profile-field__select"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Sección: Perfil creativo */}
      <section className="profile-section">
        <span className="section-label">{t("profile.creativeSection")}</span>
        <div className="profile-card">
          <div className="profile-field">
            <label className="profile-field__label">{t("profile.creatorRole")}</label>
            <select
              name="creator_role"
              value={form.creator_role}
              onChange={handleChange}
              className="profile-field__select"
            >
              <option value="">{t("profile.selectRole")}</option>
              {CREATOR_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`profile.roles.${r}`, { defaultValue: r })}
                </option>
              ))}
            </select>
          </div>
          <div className="profile-field">
            <label className="profile-field__label">{t("profile.timeAvailability")}</label>
            <select
              name="time_availability"
              value={form.time_availability}
              onChange={handleChange}
              className="profile-field__select"
            >
              <option value="">{t("profile.select")}</option>
              {TIME_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {t(`onboarding.questions.time_availability.options.${o}.label`, { defaultValue: o })}
                </option>
              ))}
            </select>
          </div>
          <div className="profile-field">
            <label className="profile-field__label">{t("profile.productionSetup")}</label>
            <select
              name="production_setup"
              value={form.production_setup}
              onChange={handleChange}
              className="profile-field__select"
            >
              <option value="">{t("profile.select")}</option>
              {SETUP_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {t(`onboarding.questions.production_setup.options.${o}.label`, { defaultValue: o })}
                </option>
              ))}
            </select>
          </div>
          <div className="profile-field">
            <label className="profile-field__label">{t("profile.referents")}</label>
            <input
              name="referents"
              value={form.referents}
              onChange={handleChange}
              placeholder={t("profile.referentsPlaceholder")}
              className="profile-field__input"
            />
          </div>
        </div>
      </section>

      {error && <p className="profile-error">{error}</p>}

      <div className="profile-footer">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          type="button"
        >
          {saving
            ? t("common.saving")
            : saved
              ? `✓ ${t("common.saved")}`
              : t("common.save")}
        </button>
      </div>
    </div>
  );
}
