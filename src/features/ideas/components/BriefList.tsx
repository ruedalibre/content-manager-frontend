import { useTranslation } from "react-i18next";
import { type CreativeSession } from "../hooks/useIdeas.ts";
import StatusBadge from "./StatusBadge.tsx";

type BriefListProps = {
  sessions: CreativeSession[];
  generating: boolean;
  onOpenSession: (session: CreativeSession) => void;
};

export default function BriefList({
  sessions,
  generating,
  onOpenSession,
}: BriefListProps) {
  const { t } = useTranslation();

  // Filtrar descartados — no aparecen en la lista
  const activeSessions = sessions
    .filter((s) => s.status !== "discarded")
    .sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  if (generating) {
    return (
      <div className="brief-list brief-list--generating">
        <div className="recipe-generating-dots">
          <span /><span /><span />
        </div>
        <p className="brief-list__generating-text">{t("recipe.generating")}</p>
      </div>
    );
  }

  if (activeSessions.length === 0) {
    return (
      <div className="brief-list brief-list--empty">
        <span className="brief-list__empty-icon">📄</span>
        <p className="brief-list__empty-text">{t("recipe.noRecipeYet")}</p>
        <p className="brief-list__empty-hint">{t("recipe.selectPlatformFormat")}</p>
      </div>
    );
  }

  return (
    <div className="brief-list">
      {activeSessions.map((session) => (
        <button
          key={session.id}
          className="brief-list__item"
          onClick={() => onOpenSession(session)}
          type="button"
        >
          <div className="brief-list__item-top">
            <StatusBadge status={session.status} />
            <span className="brief-list__item-date">
              {new Date(session.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="brief-list__item-angle">{session.recipe.angle}</p>
          <div className="brief-list__item-meta">
            <span className="brief-list__item-format">
              {session.format}
            </span>
            {session.content_role && (
              <span className="brief-list__item-role">
                · {session.content_role}
              </span>
            )}
            <span className="brief-list__item-cta">
              {t("recipe.verRecetaCompleta")} →
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
