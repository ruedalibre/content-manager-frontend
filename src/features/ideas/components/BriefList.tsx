import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type CreativeSession } from "../hooks/useIdeas.ts";
import StatusBadge from "./StatusBadge.tsx";

type BriefListProps = {
  sessions: CreativeSession[];
  generating: boolean;
  onOpenSession: (session: CreativeSession) => void;
  platformName: (platformId: string) => string;
};

export default function BriefList({
  sessions,
  generating,
  onOpenSession,
  platformName,
}: BriefListProps) {
  const { t } = useTranslation();

  const activeSessions = sessions
    .filter((s) => s.status !== "discarded")
    .sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  if (generating) {
    return (
      <div className="brief-list-card">
        <div className="brief-list-card__head">
          <span className="brief-list-card__title">{t("recipe.briefs")}</span>
        </div>
        <div className="brief-list brief-list--generating">
          <div className="recipe-generating-dots">
            <span /><span /><span />
          </div>
          <p className="brief-list__hint">{t("recipe.generating")}</p>
        </div>
      </div>
    );
  }

  if (activeSessions.length === 0) {
    return (
      <div className="brief-list-card">
        <div className="brief-list-card__head">
          <span className="brief-list-card__title">{t("recipe.briefs")}</span>
          <span className="brief-list-card__count">0 {t("recipe.briefPlural")}</span>
        </div>
        <div className="brief-list brief-list--empty">
          <span className="brief-list__empty-icon">📄</span>
          <p className="brief-list__empty-text">{t("recipe.noRecipeYet")}</p>
          <p className="brief-list__hint">{t("recipe.selectPlatformFormat")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="brief-list-card">
      <div className="brief-list-card__head">
        <span className="brief-list-card__title">{t("recipe.briefs")}</span>
        <span className="brief-list-card__count">
          {activeSessions.length}{" "}
          {activeSessions.length === 1
            ? t("recipe.briefSingular")
            : t("recipe.briefPlural")}
        </span>
      </div>
      <div className="brief-list">
        {activeSessions.map((session) => {
          const platform = platformName(session.platform_id);
          const format = session.format
            ? t(`formats.${session.format}`, { defaultValue: session.format })
            : "—";
          const role = session.content_role
            ? t(`contentRoles.${session.content_role}`, { defaultValue: session.content_role })
            : null;
          const date = new Date(session.created_at).toLocaleDateString();

          return (
            <div
              key={session.id}
              className="brief-list__row"
              onClick={() => onOpenSession(session)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onOpenSession(session)}
            >
              {/* Combinación */}
              <span className="brief-list__combo">
                {[platform, format, role].filter(Boolean).join(" · ")}
              </span>

              {/* Spacer */}
              <span className="brief-list__dots" aria-hidden="true" />

              {/* Status + descarga + fecha */}
              <div className="brief-list__right">
                {session.downloaded_at && (
                  <span
                    className="brief-list__flag brief-list__flag--downloaded"
                    title={new Date(session.downloaded_at).toLocaleDateString()}
                  >
                    <Download size={12} aria-hidden="true" />
                  </span>
                )}
                <StatusBadge status={session.status} />
                <span className="brief-list__date">{date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
