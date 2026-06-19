import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { useUserProfile } from "../../features/profile/hooks/useUserProfile";
import { useSubscription } from "../../features/subscription/hooks/useSubscription";
import AvatarEditor from "../../features/profile/components/AvatarEditor";
import { type AvatarConfig } from "../../features/profile/hooks/useAvatarUrl";
import { useCheckout } from "../../features/subscription/hooks/useCheckout";
import { usePricingModal } from "../../features/subscription/context/PricingModalContext";
import LanguageToggle from "../../components/ui/LanguageToggle.tsx";
import { supabase } from "../../supabaseClient";
import "./Profile.scss";
import {
  COUNTRIES,
  TIMEZONES,
  CREATOR_ROLES,  
  TIME_OPTIONS,  
  SETUP_OPTIONS,
} from "../../features/profile/constants/profileOptions.ts";

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
  const { isCreator, trialActive, trialEndsAt } = useSubscription();
  const { openPortal, loading: portalLoading } = useCheckout();
  const { open: openPricing } = usePricingModal();

  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(
    (profile?.avatar_config as AvatarConfig) ?? {}
  );

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
    setAvatarConfig((profile.avatar_config as AvatarConfig) ?? {});
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

        // Invalidar caché de IA para que Identity regenere en la próxima visita
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          void (async () => {
            try {
              await supabase
                .from("identity_insights_cache")
                .update({ user_lang: `stale_${form.preferred_language}` })
                .eq("user_id", session.user.id);
            } catch {
              // silent — best effort
            }
          })();
        }
      }
      await updateProfile({
        display_name:      form.display_name || null,
        country_code:      form.country_code || null,
        timezone:          form.timezone,
        creator_role:      form.creator_role || null,
        time_availability: form.time_availability || null,
        production_setup:  form.production_setup || null,
        referents:         form.referents || null,
        avatar_config:     avatarConfig,
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

      {/* Sección: Plan y facturación */}
      <section className="profile-section">
        <span className="section-label">{t("profile.billingSection")}</span>
        <div className="profile-card">

          {/* Plan actual */}
          <div className="profile-field profile-field--readonly">
            <span className="profile-field__label">{t("profile.currentPlan")}</span>
            <div className="profile-field__plan">
              <span className={`profile-plan-badge ${isCreator ? "profile-plan-badge--creator" : "profile-plan-badge--free"}`}>
                {isCreator ? "Creator" : "Free"}
              </span>
              {trialActive && trialEndsAt && (
                <span className="profile-plan-trial">
                  {t("profile.trialEnds", {
                    date: new Date(trialEndsAt).toLocaleDateString(),
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Acción según plan */}
          <div className="profile-field profile-field--readonly">
            <span className="profile-field__label">
              {isCreator ? t("profile.manageSubscription") : t("profile.upgradeLabel")}
            </span>
            <div>
              {isCreator ? (
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={openPortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? t("common.loading") : t("profile.manageSubscriptionCta")}
                </button>
              ) : (
                <button
                  className="btn-primary"
                  type="button"
                  onClick={openPricing}
                >
                  {t("profile.upgradeCta")}
                </button>
              )}
            </div>
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

      {/* Sección: Tu avatar */}
      <section className="profile-section">
        <span className="section-label">{t("profile.avatarSection")}</span>
        <div className="profile-card">
          <AvatarEditor
            seed={form.display_name || email || "creator"}
            initialConfig={avatarConfig}
            onChange={setAvatarConfig}
          />
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
