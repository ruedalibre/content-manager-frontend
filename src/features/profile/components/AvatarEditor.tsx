import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAvatarUrl, type AvatarConfig } from "../hooks/useAvatarUrl";

type Props = {
  seed: string;
  initialConfig: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
};

const SKIN_COLORS = [
  { value: "ffdbb4", label: "Muy claro" },
  { value: "edb98a", label: "Claro" },
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
  { value: "262e33", label: "Negro" },
  { value: "65c9ff", label: "Celeste" },
  { value: "5199e4", label: "Azul" },
  { value: "25557c", label: "Azul oscuro" },
  { value: "929598", label: "Gris" },
  { value: "e6e6e6", label: "Gris claro" },
  { value: "3c4f5c", label: "Petróleo" },
  { value: "b1e2ff", label: "Azul pastel" },
  { value: "a7ffc4", label: "Verde pastel" },
  { value: "ffafb9", label: "Rosa" },
  { value: "ffffb1", label: "Amarillo" },
  { value: "ff488e", label: "Rosa fuerte" },
  { value: "ff5c5c", label: "Rojo" },
  { value: "ffffff", label: "Blanco" },
];

const CLOTHES_OPTIONS = [
  { value: "blazerAndShirt", label: "Blazer y camisa" },
  { value: "blazerAndSweater", label: "Blazer y suéter" },
  { value: "collarAndSweater", label: "Cuello y suéter" },
  { value: "graphicShirt", label: "Camiseta gráfica" },
  { value: "hoodie", label: "Hoodie" },
  { value: "overall", label: "Overall" },
  { value: "shirtCrewNeck", label: "Camiseta redonda" },
  { value: "shirtScoopNeck", label: "Camiseta escote" },
  { value: "shirtVNeck", label: "Camiseta V" },
];

const CLOTHES_GRAPHIC_OPTIONS = [
  { value: "none", label: "Sin estampado" },
  { value: "bear", label: "Oso" },
  { value: "bat", label: "Murciélago" },
  { value: "deer", label: "Ciervo" },
  { value: "diamond", label: "Diamante" },
  { value: "pizza", label: "Pizza" },
  { value: "resist", label: "Resist" },
  { value: "skull", label: "Calavera" },
  { value: "skullOutline", label: "Calavera línea" },
  { value: "hola", label: "Hola" },
  { value: "cumbia", label: "Cumbia" },
];

const ACCESSORIES_OPTIONS = [
  { value: "none", label: "Ninguno" },
  { value: "prescription01", label: "Gafas redondas" },
  { value: "prescription02", label: "Gafas cuadradas" },
  { value: "round", label: "Gafas retro" },
  { value: "sunglasses", label: "Gafas de sol" },
  { value: "wayfarers", label: "Wayfarers" },
  { value: "kurt", label: "Kurt" },
  { value: "eyepatch", label: "Parche" },
];

const TOP_OPTIONS = [
  { value: "shortFlat", label: "Corto liso" },
  { value: "shortWaved", label: "Corto ondulado" },
  { value: "shortCurly", label: "Corto rizado" },
  { value: "shortRound", label: "Corto redondeado" },
  { value: "theCaesar", label: "César" },
  { value: "theCaesarAndSidePart", label: "César con raya" },
  { value: "sides", label: "Laterales" },
  { value: "straight01", label: "Liso 1" },
  { value: "straight02", label: "Liso 2" },
  { value: "straightAndStrand", label: "Liso con mechón" },
  { value: "longButNotTooLong", label: "Largo natural" },
  { value: "curly", label: "Rizado" },
  { value: "curvy", label: "Ondulado" },
  { value: "bob", label: "Bob" },
  { value: "bun", label: "Moño" },
  { value: "bigHair", label: "Voluminoso" },
  { value: "fro", label: "Afro" },
  { value: "froBand", label: "Afro con banda" },
  { value: "miaWallace", label: "Mia Wallace" },
  { value: "shavedSides", label: "Lados rapados" },
  { value: "shaggy", label: "Despeinado" },
  { value: "shaggyMullet", label: "Mullet" },
  { value: "frizzle", label: "Encrespado" },
  { value: "dreads", label: "Rastas" },
  { value: "dreads01", label: "Rastas 2" },
  { value: "dreads02", label: "Rastas 3" },
  { value: "frida", label: "Frida" },
  { value: "hat", label: "Sombrero" },
  { value: "winterHat1", label: "Gorro invierno" },
  { value: "winterHat02", label: "Gorro invierno 2" },
  { value: "winterHat03", label: "Gorro invierno 3" },
  { value: "winterHat04", label: "Gorro invierno 4" },
  { value: "turban", label: "Turbante" },
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
  { value: "winkWacky", label: "Guiño loco" },
  { value: "hearts", label: "Corazones" },
  { value: "surprised", label: "Sorprendido" },
  { value: "closed", label: "Cerrados" },
  { value: "squint", label: "Entrecerrados" },
  { value: "side", label: "Lados" },
  { value: "eyeRoll", label: "En blanco" },
  { value: "cry", label: "Llorando" },
  { value: "xDizzy", label: "Mareado" },
];

const EYEBROWS_OPTIONS = [
  { value: "default", label: "Normal" },
  { value: "defaultNatural", label: "Natural" },
  { value: "raisedExcited", label: "Emocionadas" },
  { value: "raisedExcitedNatural", label: "Emocionadas natural" },
  { value: "flatNatural", label: "Planas" },
  { value: "frownNatural", label: "Fruncidas" },
  { value: "angry", label: "Enojadas" },
  { value: "angryNatural", label: "Enojadas natural" },
  { value: "sadConcerned", label: "Triste" },
  { value: "sadConcernedNatural", label: "Triste natural" },
  { value: "upDown", label: "Arriba abajo" },
  { value: "upDownNatural", label: "Arriba abajo natural" },
  { value: "unibrowNatural", label: "Ceja única" },
];

const MOUTH_OPTIONS = [
  { value: "default", label: "Normal" },
  { value: "smile", label: "Sonrisa" },
  { value: "serious", label: "Serio" },
  { value: "tongue", label: "Lengua" },
  { value: "twinkle", label: "Pícaro" },
  { value: "sad", label: "Triste" },
  { value: "concerned", label: "Preocupado" },
  { value: "disbelief", label: "Incrédulo" },
  { value: "eating", label: "Comiendo" },
  { value: "grimace", label: "Mueca" },
  { value: "screamOpen", label: "Gritando" },
  { value: "vomit", label: "..." },
];

export default function AvatarEditor({ seed, initialConfig, onChange }: Props) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<AvatarConfig>(initialConfig);
  const avatarUrl = useAvatarUrl(seed, config);

  useEffect(() => {
    setConfig(initialConfig);
  }, [JSON.stringify(initialConfig)]);

  const update = useCallback(
    (key: keyof AvatarConfig, value: string) => {
      setConfig((prev) => {
        const next = { ...prev, [key]: value };
        setTimeout(() => onChange(next), 0);
        return next;
      });
    },
    [onChange],
  );

  return (
    <div className="avatar-editor">
      {/* Preview */}
      <div className="avatar-editor__preview">
        <img
          key={avatarUrl}
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
          <label className="avatar-editor__label">
            {t("profile.avatar.skinColor")}
          </label>
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
          <label className="avatar-editor__label">
            {t("profile.avatar.top")}
          </label>
          <select
            className="avatar-editor__select"
            value={config.top ?? ""}
            onChange={(e) => update("top", e.target.value)}
          >
            {TOP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Color de cabello */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">
            {t("profile.avatar.hairColor")}
          </label>
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
          <label className="avatar-editor__label">
            {t("profile.avatar.facialHair")}
          </label>
          <select
            className="avatar-editor__select"
            value={config.facialHair ?? "none"}
            onChange={(e) => update("facialHair", e.target.value)}
          >
            {FACIAL_HAIR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Color de vello facial — solo si hay vello facial */}
        {config.facialHair && config.facialHair !== "none" && (
          <div className="avatar-editor__field">
            <label className="avatar-editor__label">
              {t("profile.avatar.facialHairColor")}
            </label>
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
          <label className="avatar-editor__label">
            {t("profile.avatar.eyes")}
          </label>
          <select
            className="avatar-editor__select"
            value={config.eyes ?? ""}
            onChange={(e) => update("eyes", e.target.value)}
          >
            {EYES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cejas */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">
            {t("profile.avatar.eyebrows")}
          </label>
          <select
            className="avatar-editor__select"
            value={config.eyebrows ?? ""}
            onChange={(e) => update("eyebrows", e.target.value)}
          >
            {EYEBROWS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Boca */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">
            {t("profile.avatar.mouth")}
          </label>
          <select
            className="avatar-editor__select"
            value={config.mouth ?? ""}
            onChange={(e) => update("mouth", e.target.value)}
          >
            {MOUTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Color de ropa */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">
            {t("profile.avatar.clothesColor")}
          </label>
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

        {/* Tipo de ropa */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">
            {t("profile.avatar.clothes")}
          </label>
          <select
            className="avatar-editor__select"
            value={config.clothes ?? ""}
            onChange={(e) => update("clothes", e.target.value)}
          >
            {CLOTHES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Estampado — solo si es graphicShirt */}
        {config.clothes === "graphicShirt" && (
          <div className="avatar-editor__field">
            <label className="avatar-editor__label">
              {t("profile.avatar.clothesGraphic")}
            </label>
            <select
              className="avatar-editor__select"
              value={config.clothesGraphic ?? "none"}
              onChange={(e) => update("clothesGraphic", e.target.value)}
            >
              {CLOTHES_GRAPHIC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Accesorios */}
        <div className="avatar-editor__field">
          <label className="avatar-editor__label">
            {t("profile.avatar.accessories")}
          </label>
          <select
            className="avatar-editor__select"
            value={config.accessories ?? "none"}
            onChange={(e) => update("accessories", e.target.value)}
          >
            {ACCESSORIES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
