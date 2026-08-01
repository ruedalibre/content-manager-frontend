import { useState } from "react";
import { Archive, Pencil, Copy, Trash2, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type Idea } from "../hooks/useIdeas.ts";
import { type Topic } from "../hooks/useTopics.ts";

type IdeaCardState = {
  platform_id: string;
  format: string;
  content_role?: string;
  content_goal?: string;
  cta_intent?: string;
  target_audience?: string;
  ready_to_use: boolean;
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
  onGoalChange: (goal: string) => void;
  onCtaIntentChange: (cta: string) => void;
  onAudienceChange: (audience: string) => void;
  onReadyToUseChange: (ready: boolean) => void;
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
  onGoalChange,
  onCtaIntentChange,
  onAudienceChange,
  onReadyToUseChange,
  onGenerate,
  onOpenTopicSelector,
  onToggleTopic,
  onSaveTopics,
  onCancelTopics,
  onToggleCollapse,
  savingTopics,
}: Props) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
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
          <span
            className={`badge ${isGenerated ? "badge--generated" : "badge--manual"}`}
          >
            {isGenerated ? t("ideas.generated") : t("ideas.manual")}
          </span>
        </div>
        {!isEditing && (
          <div
            className="idea-card__controls"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn-icon"
              onClick={onEditOpen}
              title={t("common.edit")}
              type="button"
            >
              <Pencil size={14} />
            </button>
            <button
              className="btn-icon"
              onClick={onDuplicate}
              title={t("ideas.duplicate")}
              type="button"
            >
              <Copy size={14} />
            </button>
            <button
              className="btn-icon"
              onClick={onArchive}
              title={t("ideas.archive")}
              type="button"
            >
              <Archive size={14} />
            </button>
            <button
              className="btn-icon btn-icon--danger"
              onClick={onDelete}
              title={t("common.delete")}
              type="button"
            >
              <Trash2 size={14} />
            </button>
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
                <button
                  className="btn-secondary"
                  onClick={onEditCancel}
                  disabled={editSaving}
                  type="button"
                >
                  {t("common.cancel")}
                </button>
                <button
                  className="btn-primary"
                  onClick={onEditSave}
                  disabled={editSaving || !editTitle.trim()}
                  type="button"
                >
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
                    <span
                      key={topic.id}
                      className="topic-chip topic-chip--small"
                    >
                      {topic.name}
                    </span>
                  ))
                ) : (
                  <span className="idea-card__no-topics">
                    {t("ideas.noTopicsYet")}
                  </span>
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
                  <p className="idea-card__topic-selector-label">
                    {t("ideas.selectTopics")}
                  </p>
                  <div className="idea-card__topic-options">
                    {topics.length === 0 ? (
                      <p className="idea-card__no-topics">
                        {t("ideas.noTopicsYet")}
                      </p>
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
                    <button
                      className="btn-secondary"
                      onClick={onCancelTopics}
                      type="button"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      className="btn-primary"
                      onClick={onSaveTopics}
                      disabled={savingTopics}
                      type="button"
                    >
                      {savingTopics ? t("common.saving") : t("common.save")}
                    </button>
                  </div>
                </div>
              )}

              {/* PLATFORM + FORMAT + ROLE */}
              {/* PLATFORM + FORMAT + ROLE */}
              <div className="idea-card__recipe-controls">
                <select
                  value={state.platform_id}
                  onChange={(e) => onPlatformChange(e.target.value)}
                  className="idea-card__select"
                >
                  <option value="">{t("ideas.platformPlaceholder")}</option>
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={state.format}
                  onChange={(e) => onFormatChange(e.target.value)}
                  disabled={!state.platform_id}
                  className="idea-card__select"
                >
                  <option value="">{t("ideas.formatPlaceholder")}</option>
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {t(`formats.${f}`, { defaultValue: f })}
                    </option>
                  ))}
                </select>
                <select
                  value={state.content_role ?? ""}
                  onChange={(e) => onRoleChange(e.target.value)}
                  className="idea-card__select"
                >
                  <option value="">{t("contentRoles.selectRole")}</option>
                  <option value="educational">
                    {t("contentRoles.educational")}
                  </option>
                  <option value="inspirational">
                    {t("contentRoles.inspirational")}
                  </option>
                  <option value="personal">{t("contentRoles.personal")}</option>
                  <option value="promotional">
                    {t("contentRoles.promotional")}
                  </option>
                  <option value="curated">{t("contentRoles.curated")}</option>
                  <option value="sales">{t("contentRoles.sales")}</option>
                </select>
              </div>

              {/* SECCIÓN AVANZADO */}
              {showAdvanced && (
                <div className="idea-card__advanced">
                  <p className="idea-card__advanced-title">
                    {t("ideas.advanced")}
                  </p>
                  <div className="idea-card__advanced-grid">
                    <div className="idea-card__advanced-field">
                      <label className="idea-card__advanced-label">
                        {t("ideas.contentGoalLabel")}
                      </label>
                      <select
                        value={state.content_goal ?? ""}
                        onChange={(e) => onGoalChange(e.target.value)}
                        className="idea-card__select"
                      >
                        <option value="">{t("ideas.contentGoalEmpty")}</option>
                        <option value="awareness">
                          {t("ideas.contentGoals.awareness")}
                        </option>
                        <option value="educate">
                          {t("ideas.contentGoals.educate")}
                        </option>
                        <option value="authority">
                          {t("ideas.contentGoals.authority")}
                        </option>
                        <option value="engagement">
                          {t("ideas.contentGoals.engagement")}
                        </option>
                        <option value="entertain">
                          {t("ideas.contentGoals.entertain")}
                        </option>
                        <option value="convert">
                          {t("ideas.contentGoals.convert")}
                        </option>
                      </select>
                    </div>
                    <div className="idea-card__advanced-field">
                      <label className="idea-card__advanced-label">
                        {t("ideas.ctaIntentLabel")}
                      </label>
                      <select
                        value={state.cta_intent ?? ""}
                        onChange={(e) => onCtaIntentChange(e.target.value)}
                        className="idea-card__select"
                      >
                        <option value="">{t("ideas.ctaIntentEmpty")}</option>
                        <option value="follow">
                          {t("ideas.ctaIntents.follow")}
                        </option>
                        <option value="comment">
                          {t("ideas.ctaIntents.comment")}
                        </option>
                        <option value="save">
                          {t("ideas.ctaIntents.save")}
                        </option>
                        <option value="share">
                          {t("ideas.ctaIntents.share")}
                        </option>
                        <option value="visit_link">
                          {t("ideas.ctaIntents.visit_link")}
                        </option>
                        <option value="buy">{t("ideas.ctaIntents.buy")}</option>
                        <option value="dm">{t("ideas.ctaIntents.dm")}</option>
                        <option value="none">
                          {t("ideas.ctaIntents.none")}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="idea-card__advanced-field">
                    <label className="idea-card__advanced-label">
                      {t("ideas.targetAudienceLabel")}
                    </label>
                    <input
                      type="text"
                      value={state.target_audience ?? ""}
                      onChange={(e) => onAudienceChange(e.target.value)}
                      placeholder={t("ideas.targetAudiencePlaceholder")}
                      maxLength={100}
                      className="idea-card__advanced-input"
                    />
                  </div>

                  <div className="idea-card__advanced-field idea-card__advanced-field--checkbox">
                    <label className="idea-card__checkbox-label">
                      <input
                        type="checkbox"
                        checked={state.ready_to_use ?? false}
                        onChange={(e) => onReadyToUseChange(e.target.checked)}
                      />
                      <span>{t("ideas.readyToUse")}</span>
                    </label>
                    <p className="idea-card__checkbox-hint">
                      {t("ideas.readyToUseHint")}
                    </p>
                  </div>
                </div>
              )}

              {state.error && <p className="idea-card__error">{state.error}</p>}

              {/* FOOTER */}
              <div className="idea-card__footer">
                <button
                  type="button"
                  className="idea-card__advanced-toggle"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                >
                  <ChevronRight
                    size={12}
                    className={`idea-card__advanced-chevron ${showAdvanced ? "idea-card__advanced-chevron--open" : ""}`}
                    aria-hidden="true"
                  />
                  {t("ideas.advanced")}
                </button>
                {canCreateBriefs ? (
                  <button
                    className={`btn-generate ${state.generating ? "btn-generate--loading" : ""}`}
                    onClick={onGenerate}
                    disabled={
                      state.generating || !state.platform_id || !state.format
                    }
                    type="button"
                  >
                    {state.generating
                      ? t("recipe.generating")
                      : t("recipe.generate")}
                  </button>
                ) : (
                  <button
                    className="btn-generate btn-generate--locked"
                    type="button"
                    disabled
                    title={t("upgrade.briefsLocked")}
                  >
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
