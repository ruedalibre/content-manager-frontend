import { Archive, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type Idea } from "../hooks/useIdeas.ts";
import { type Topic } from "../hooks/useTopics.ts";

type IdeaCardState = {
  platform_id: string;
  format: string;
  content_role?: string;
  generating: boolean;
  error: string | null;
};

type Platform = { id: string; name: string };

type Props = {
  idea: Idea;
  state: IdeaCardState;
  formats: string[];
  platforms: Platform[];
  topics: Topic[];
  canCreateBriefs: boolean;
  isEditing: boolean;
  isEditingTopics: boolean;
  isCollapsed: boolean;
  editTitle: string;
  editDescription: string;
  editError: string | null;
  editSaving: boolean;
  selectedTopicIds: string[];
  onEditOpen: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditTitleChange: (v: string) => void;
  onEditDescriptionChange: (v: string) => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onPlatformChange: (platformId: string) => void;
  onFormatChange: (format: string) => void;
  onRoleChange: (role: string) => void;
  onGenerate: () => void;
  onOpenTopicSelector: () => void;
  onToggleTopic: (topicId: string) => void;
  onSaveTopics: () => void;
  onCancelTopics: () => void;
  onToggleCollapse: () => void;
  savingTopics: boolean;
};

export default function IdeaCard({
  idea,
  state,
  formats,
  platforms,
  topics,
  canCreateBriefs,
  isEditing,
  isEditingTopics,
  isCollapsed,
  editTitle,
  editDescription,
  editError,
  editSaving,
  selectedTopicIds,
  onEditOpen,
  onEditSave,
  onEditCancel,
  onEditTitleChange,
  onEditDescriptionChange,
  onDuplicate,
  onArchive,
  onDelete,
  onPlatformChange,
  onFormatChange,
  onRoleChange,
  onGenerate,
  onOpenTopicSelector,
  onToggleTopic,
  onSaveTopics,
  onCancelTopics,
  onToggleCollapse,
  savingTopics,
}: Props) {
  const { t } = useTranslation();
  const isGenerated = idea.source === "generated";
  const contentCount = idea.contents?.[0]?.count ?? 0;

  return (
    <div className={`idea-card ${isCollapsed ? "idea-card--collapsed" : ""}`}>

      {/* FILA SUPERIOR: chevron + badge + controles */}
      <div className="idea-card__top" onClick={onToggleCollapse}>
        <div className="idea-card__top-left">
          <ChevronRight
            size={12}
            className={`idea-card__chevron ${!isCollapsed ? "idea-card__chevron--open" : ""}`}
            aria-hidden="true"
          />
          <span className={`badge ${isGenerated ? "badge--generated" : "badge--manual"}`}>
            {isGenerated ? t("ideas.generated") : t("ideas.manual")}
          </span>
        </div>
        {!isEditing && (
          <div className="idea-card__controls" onClick={(e) => e.stopPropagation()}>
            <button className="btn-icon" onClick={onEditOpen} title={t("common.edit")} type="button">✏️</button>
            <button className="btn-icon" onClick={onDuplicate} title={t("ideas.duplicate")} type="button">⧉</button>
            <button className="btn-icon" onClick={onArchive} title={t("ideas.archive")} type="button">
              <Archive size={14} />
            </button>
            <button className="btn-icon btn-icon--danger" onClick={onDelete} title={t("common.delete")} type="button">🗑️</button>
          </div>
        )}
      </div>

      {/* TÍTULO — siempre visible, clickeable para colapsar */}
      <div className="idea-card__title-row" onClick={onToggleCollapse}>
        <h4 className="idea-card__title">{idea.title}</h4>
      </div>

      {/* META — siempre visible */}
      <div className="idea-card__meta-row">
        <span className="idea-card__stats">
          {contentCount === 0
            ? t("ideas.noContentsYet")
            : `${contentCount} ${contentCount === 1 ? t("ideas.content") : t("ideas.contents")}`}
        </span>
      </div>

      {/* BODY — solo visible cuando expandido */}
      {!isCollapsed && (
        <div className="idea-card__body">
          {/* EDIT MODE */}
          {isEditing ? (
            <div className="idea-card__edit">
              <input
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                placeholder={t("ideas.ideaTitlePlaceholder")}
                autoFocus
              />
              <textarea
                value={editDescription}
                onChange={(e) => onEditDescriptionChange(e.target.value)}
                placeholder={t("ideas.descriptionOptional")}
                rows={2}
              />
              {editError && <p className="idea-card__error">{editError}</p>}
              <div className="idea-card__edit-actions">
                <button className="btn-secondary" onClick={onEditCancel} disabled={editSaving} type="button">
                  {t("common.cancel")}
                </button>
                <button className="btn-primary" onClick={onEditSave} disabled={editSaving || !editTitle.trim()} type="button">
                  {editSaving ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </div>
          ) : (
            <>
              {idea.description && (
                <p className="idea-card__description">{idea.description}</p>
              )}

              {/* TOPICS */}
              <div className="idea-card__topics">
                {idea.topics && idea.topics.length > 0 ? (
                  idea.topics.map((topic) => (
                    <span key={topic.id} className="topic-chip topic-chip--small">{topic.name}</span>
                  ))
                ) : (
                  <span className="idea-card__no-topics">{t("ideas.noTopicsYet")}</span>
                )}
                <button
                  className="topic-chip topic-chip--add"
                  onClick={onOpenTopicSelector}
                  type="button"
                  title={t("common.editTopics")}
                >
                  {isEditingTopics ? "✕" : "＋"}
                </button>
              </div>

              {/* TOPIC SELECTOR */}
              {isEditingTopics && (
                <div className="idea-card__topic-selector">
                  <p className="idea-card__topic-selector-label">{t("ideas.selectTopics")}</p>
                  <div className="idea-card__topic-options">
                    {topics.length === 0 ? (
                      <p className="idea-card__no-topics">{t("ideas.noTopicsYet")}</p>
                    ) : (
                      topics.map((topic: Topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          className={`topic-chip topic-chip--selectable ${selectedTopicIds.includes(topic.id) ? "topic-chip--active" : ""}`}
                          onClick={() => onToggleTopic(topic.id)}
                        >
                          {topic.name}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="idea-card__topic-actions">
                    <button className="btn-secondary" onClick={onCancelTopics} type="button">
                      {t("common.cancel")}
                    </button>
                    <button className="btn-primary" onClick={onSaveTopics} disabled={savingTopics} type="button">
                      {savingTopics ? t("common.saving") : t("common.save")}
                    </button>
                  </div>
                </div>
              )}

              {/* PLATFORM + FORMAT + ROLE */}
              <div className="idea-card__recipe-controls">
                <select value={state.platform_id} onChange={(e) => onPlatformChange(e.target.value)} className="idea-card__select">
                  <option value="">{t("ideas.platformPlaceholder")}</option>
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <select value={state.format} onChange={(e) => onFormatChange(e.target.value)} disabled={!state.platform_id} className="idea-card__select">
                  <option value="">{t("ideas.formatPlaceholder")}</option>
                  {formats.map((f) => (
                    <option key={f} value={f}>{t(`formats.${f}`, { defaultValue: f })}</option>
                  ))}
                </select>
                <select value={state.content_role ?? ""} onChange={(e) => onRoleChange(e.target.value)} className="idea-card__select">
                  <option value="">{t("contentRoles.selectRole")}</option>
                  <option value="educational">{t("contentRoles.educational")}</option>
                  <option value="inspirational">{t("contentRoles.inspirational")}</option>
                  <option value="personal">{t("contentRoles.personal")}</option>
                  <option value="promotional">{t("contentRoles.promotional")}</option>
                  <option value="curated">{t("contentRoles.curated")}</option>
                  <option value="sales">{t("contentRoles.sales")}</option>
                </select>
              </div>

              {state.error && <p className="idea-card__error">{state.error}</p>}

              {/* FOOTER */}
              <div className="idea-card__footer">
                {canCreateBriefs ? (
                  <button
                    className={`btn-generate ${state.generating ? "btn-generate--loading" : ""}`}
                    onClick={onGenerate}
                    disabled={state.generating || !state.platform_id || !state.format}
                    type="button"
                  >
                    {state.generating ? t("recipe.generating") : t("recipe.generate")}
                  </button>
                ) : (
                  <button className="btn-generate btn-generate--locked" type="button" disabled title={t("upgrade.briefsLocked")}>
                    ✦ {t("recipe.generate")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
