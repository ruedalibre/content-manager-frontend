import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAvatarUrl, type AvatarConfig } from "../hooks/useAvatarUrl";

type Props = {
  seed: string;
  initialConfig: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
};

const SKIN_COLORS = [
  { value: "ffdbb4", label: "Claro" },
  { value: "f8d25c", label: "Dorado" },
  { value: "fd9841", label: "Trigueño" },
  { value: "d08b5b", label: "Moreno" },
  { value: "ae5d29", label: "Canela" },
  { value: "614335", label: "Oscuro" },
];

const HAIR_COLORS = [
  { value: "2c1b18", label: "Negro" },
  { value: "724133", label: "Castaño" },
  { value: "b58143", label: "Castaño claro" },
  { value: "d6b370", label: "Rubio" },
  { value: "a55728", label: "Rojizo" },
  { value: "f59797", label: "Rosa" },
  { value: "ecdcbf", label: "Platino" },
  { value: "c93305", label: "Rojo" },
];

const CLOTHES_COLORS = [
  { value: "364965", label: "Slate" },
  { value: "c47859", label: "Terracota" },
  { value: "3c4f5c", label: "Petróleo" },
  { value: "b1e2ff", label: "Celeste" },
  { value: "ff5c5c", label: "Rojo" },
  { value: "ffffff", label: "Blanco" },
  { value: "262e33", label: "Negro" },
  { value: "65c9ff", label: "Azul" },
];

const TOP_OPTIONS = [
  { value: "shortHairShortFlat", label: "Corto liso" },
  { value: "shortHairShortWaved", label: "Corto ondulado" },
  { value: "shortHairShortCurly", label: "Corto rizado" },
  { value: "shortHairTheCaesar", label: "César" },
  { value: "longHairStraight", label: "Largo liso" },
  { value: "longHairWavy", label: "Largo ondulado" },
  { value: "longHairBob", label: "Bob" },
  { value: "longHairCurly", label: "Largo rizado" },
  { value: "longHairBun", label: "Moño" },
  { value: "longHairFro", label: "Afro" },
  { value: "dreads01", label: "Rastas" },
  { value: "hat", label: "Sombrero" },
  { value: "turban", label: "Turbante" },
  { value: "eyepatch", label: "Parche" },
];

const FACIAL_HAIR_OPTIONS = [
  { value: "none", label: "Ninguno" },
  { value: "beardLight", label: "Barba corta" },
  { value: "beardMedium", label: "Barba media" },
  { value: "beardMajestic", label: "Barba larga" },
  { value: "moustacheFancy", label: "Bigote fancy" },
  { value: "moustacheMagnum", label: "Bigote magnum" },
];

const EYES_OPTIONS = [
  { value: "default", label: "Normal" },
  { value: "happy", label: "Feliz" },
  { value: "wink", label: "Guiño" },
  { value: "hearts", label: "Corazones" },
  { value: "surprised", label: "Sorprendido" },
  { value: "close", label: "Cerrados" },
  { value: "squint", label: "Entrecerrados" },
  { value: "side", label: "Lados" },
];

const EYEBROWS_OPTIONS = [
  { value: "default", label: "Normal" },
  { value: "defaultNatural", label: "Natural" },
  { value: "raisedExcited", label: "Emocionadas" },
  { value: "raisedExcitedNatural", label: "Emocionadas natural" },
  { value: "flatNatural", label: "Planas" },
  { value: "angryNatural", label: "Enojadas" },
  { value: "sadConcerned", label: "Triste" },
  { value: "sadConcernedNatural", label: "Triste natural" },
  { value: "upDown", label: "Arriba abajo" },
  { value: "frownNatural", label: "Fruncidas" },
];

const MOUTH_OPTIONS = [
  { value: "default", label: "Normal" },
  { value: "smile", label: "Sonrisa" },
  { value: "serious", label: "Serio" },
  { value: "tongue", label: "Lengua" },
  { value: "twinkle", label: "Pícaro" },
  { value: "sad", label: "Triste" },
  { value: "screamOpen", label: "Gritando" },
];

export default function AvatarEditor({ seed, initialConfig, onChange }: Props) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<AvatarConfig>(initialConfig);
  const avatarUrl = useAvatarUrl(seed, config);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const update = useCallback((key: keyof AvatarConfig, value: string) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      onChange(next);
      return next;
    });
  }, [onChange]);

  return (
    <div className="avatar-editor">
      {/* Preview */}
      <div className="avatar-editor__preview">
        <img
          src={avatarUrl}
          alt="avatar"
          className="avatar-editor__img"
          width={120}
          height={120}
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
          onLoad={(e) => {
            e.currentTarget.style.visibility = "visible";
          }}
        />
      </div>

      <div className="avatar-editor__controls">
        {/* Tono de piel */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">{t("profile.avatar.skinColor")}</label>
          <div className="avatar-editor__swatches">
            {SKIN_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`avatar-editor__swatch ${config.skinColor === c.value ? "avatar-editor__swatch--active" : ""}`}
                style={{ background: `#${c.value}` }}
                title={c.label}
                onClick={() => update("skinColor", c.value)}
              />
            ))}
          </div>
        </div>

        {/* Cabello */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">{t("profile.avatar.top")}</label>
          <select
            className="avatar-editor__select"
            value={config.top ?? ""}
            onChange={(e) => update("top", e.target.value)}
          >
            {TOP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Color de cabello */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">{t("profile.avatar.hairColor")}</label>
          <div className="avatar-editor__swatches">
            {HAIR_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`avatar-editor__swatch ${config.hairColor === c.value ? "avatar-editor__swatch--active" : ""}`}
                style={{ background: `#${c.value}` }}
                title={c.label}
                onClick={() => update("hairColor", c.value)}
              />
            ))}
          </div>
        </div>

        {/* Vello facial */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">{t("profile.avatar.facialHair")}</label>
          <select
            className="avatar-editor__select"
            value={config.facialHair ?? "none"}
            onChange={(e) => update("facialHair", e.target.value)}
          >
            {FACIAL_HAIR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Color de vello facial — solo si hay vello facial */}
        {config.facialHair && config.facialHair !== "none" && (
          <div className="avatar-editor__field">
            <label className="avatar-editor__label">{t("profile.avatar.facialHairColor")}</label>
            <div className="avatar-editor__swatches">
              {HAIR_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`avatar-editor__swatch ${config.facialHairColor === c.value ? "avatar-editor__swatch--active" : ""}`}
                  style={{ background: `#${c.value}` }}
                  title={c.label}
                  onClick={() => update("facialHairColor", c.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Ojos */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">{t("profile.avatar.eyes")}</label>
          <select
            className="avatar-editor__select"
            value={config.eyes ?? ""}
            onChange={(e) => update("eyes", e.target.value)}
          >
            {EYES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Cejas */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">{t("profile.avatar.eyebrows")}</label>
          <select
            className="avatar-editor__select"
            value={config.eyebrows ?? ""}
            onChange={(e) => update("eyebrows", e.target.value)}
          >
            {EYEBROWS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Boca */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">{t("profile.avatar.mouth")}</label>
          <select
            className="avatar-editor__select"
            value={config.mouth ?? ""}
            onChange={(e) => update("mouth", e.target.value)}
          >
            {MOUTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Color de ropa */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">{t("profile.avatar.clothesColor")}</label>
          <div className="avatar-editor__swatches">
            {CLOTHES_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`avatar-editor__swatch ${config.clothesColor === c.value ? "avatar-editor__swatch--active" : ""}`}
                style={{ background: `#${c.value}` }}
                title={c.label}
                onClick={() => update("clothesColor", c.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
