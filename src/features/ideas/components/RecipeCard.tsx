import { useTranslation } from "react-i18next";
import { type CreativeSession } from "../hooks/useIdeas.ts";
import StatusBadge from "./StatusBadge.tsx";

type RecipeCardProps = {
  session: CreativeSession | null;
  generating: boolean;
  onClick: () => void;
  showDiscardMessage: boolean;
};

export default function RecipeCard({
  session,
  generating,
  onClick,
  showDiscardMessage,
}: RecipeCardProps) {
  const { t } = useTranslation();

  if (generating) {
    return (
      <div className="recipe-card recipe-card--generating">
        <div className="recipe-card__generating">
          <div className="recipe-generating-dots">
            <span />
            <span />
            <span />
          </div>
          <p>{t("recipe.generating")}</p>
        </div>
      </div>
    );
  }

  if (showDiscardMessage) {
    return (
      <div className="recipe-card recipe-card--discarded">
        <div className="recipe-card__empty-content">
          <span className="recipe-card__empty-icon">🔄</span>
          <p className="recipe-card__empty-text">{t("recipe.discarded")}</p>
          <p className="recipe-card__empty-hint">
            {t("recipe.tryNewCombination")}
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="recipe-card recipe-card--empty">
        <div className="recipe-card__empty-content">
          <span className="recipe-card__empty-icon">📄</span>
          <p className="recipe-card__empty-text">{t("recipe.noRecipeYet")}</p>
          <p className="recipe-card__empty-hint">
            {t("recipe.selectPlatformFormat")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-card recipe-card--ready" onClick={onClick}>
      <div className="recipe-card__header">
        <StatusBadge status={session.status} />
        <span className="recipe-card__date">
          {new Date(session.created_at).toLocaleDateString()}
        </span>
      </div>
      <div className="recipe-card__content">
        <p className="recipe-card__angle">{session.recipe.angle}</p>
        <p className="recipe-card__hook">{session.recipe.hook}</p>
      </div>
      <div className="recipe-card__footer">
        <span className="recipe-card__format">{session.format}</span>
        <span className="recipe-card__cta">{t("recipe.verRecetaCompleta")}</span>
      </div>
    </div>
  );
}
