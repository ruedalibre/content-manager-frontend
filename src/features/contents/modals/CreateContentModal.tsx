import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./CreateContentModal.scss";
import { supabase } from "../../../supabaseClient.ts";
import { useTopics } from "../../ideas/hooks/useTopics.ts";

/* =========================
   TYPES
========================= */

type ContentItem = {
  id: string;
  title: string;
  description: string | null;
  platform_id: string;
  format: string;
  status: string;
  location: string | null;
  is_reusable: boolean;
  published_at: string | null;
  content_role?: string | null;
};

type Platform = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  is_active: boolean;
  platform_types: { id: string; name: string };
};

type Idea = {
  id: string;
  title: string;
  description?: string | null;
  topics?: { id: string; name: string }[];
  platform_id?: string;
  format?: string;
  content_role?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  contentToEdit?: ContentItem | null;
  idea?: Idea | null;
};

/* =========================
   TOPIC COMBOBOX
========================= */

type TopicComboboxProps = {
  topics: { id: string; name: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

function TopicCombobox({ topics, selectedIds, onToggle }: TopicComboboxProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = topics.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedIds.includes(t.id),
  );

  return (
    <div className="topic-combobox">
      <input
        type="text"
        placeholder={t("ideas.searchTopics")}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        className="topic-combobox__input"
      />
      {isOpen && filtered.length > 0 && (
        <div className="topic-combobox__dropdown">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              className="topic-combobox__option"
              onMouseDown={() => {
                onToggle(t.id);
                setSearch("");
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================
   COMPONENT
========================= */

export default function CreateContentModal({
  isOpen,
  onClose,
  onCreated,
  contentToEdit,
  idea,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    description: "",
    platform_id: "",
    format: "",
    status: "draft",
    location: "",
    is_reusable: false,
    published_at: "",
    content_role: "",
  });

  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = !!contentToEdit;

  const { topics } = useTopics();

  /* =========================
     HELPERS
  ========================= */

  const getSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  };

  const getHeaders = (session: { access_token: string } | null) => ({
    Authorization: `Bearer ${session?.access_token}`,
  });

  /* =========================
     FETCH PLATFORMS
  ========================= */

  useEffect(() => {
    if (!isOpen) return;
    const loadPlatforms = async () => {
      try {
        const session = await getSession();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/platforms`,
          { headers: getHeaders(session) },
        );
        const data: Platform[] = await res.json();
        setPlatforms(data);
      } catch (err) {
        console.error("Platform fetch error:", err);
      }
    };
    loadPlatforms();
  }, [isOpen]);

  /* =========================
     FETCH FORMATS
  ========================= */

  const fetchFormats = async (platformId: string) => {
    try {
      const session = await getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/platform-formats?platform_id=${platformId}`,
        { headers: getHeaders(session) },
      );
      const data: string[] = await res.json();
      setFormats(data);
    } catch (err) {
      console.error("Format fetch error:", err);
    }
  };

  /* =========================
     PREFILL EDIT MODE
  ========================= */

  useEffect(() => {
    if (contentToEdit) {
      setForm({
        title: contentToEdit.title,
        description: contentToEdit.description ?? "",
        platform_id: contentToEdit.platform_id,
        format: contentToEdit.format,
        status: contentToEdit.status,
        location: contentToEdit.location ?? "",
        is_reusable: contentToEdit.is_reusable,
        published_at: contentToEdit.published_at
          ? contentToEdit.published_at.slice(0, 16)
          : "",
        content_role: contentToEdit.content_role ?? "",
      });
      fetchFormats(contentToEdit.platform_id);

      // Cargar topics e ideas actuales del contenido
      const loadAssociations = async () => {
        try {
          const session = await getSession();
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-content-associations?content_id=${contentToEdit.id}`,
            { headers: getHeaders(session) },
          );
          if (res.ok) {
            const data = await res.json();
            setSelectedTopicIds(
              data.topics?.map((t: { id: string }) => t.id) ?? [],
            );
          }
        } catch (err) {
          console.error("Associations fetch error:", err);
        }
      };
      loadAssociations();
    } else {
      resetForm();
    }
  }, [contentToEdit]);

  /* =========================
     PREFILL FROM IDEA
  ========================= */

  useEffect(() => {
    if (!idea || isEditMode) return;
    setForm((prev) => ({
      ...prev,
      title: idea.title,
      description: idea.description ?? "",
      platform_id: idea.platform_id ?? "",
      format: idea.format ?? "",
      content_role: idea.content_role ?? "",
    }));
    setSelectedTopicIds(idea.topics?.map((t) => t.id) ?? []);
    if (idea.platform_id) {
      fetchFormats(idea.platform_id);
    }
  }, [idea, isEditMode]);

  /* =========================
     RESET FORM
  ========================= */

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      platform_id: "",
      format: "",
      status: "draft",
      location: "",
      is_reusable: false,
      published_at: "",
      content_role: "",
    });
    setFormats([]);
    setSelectedTopicIds([]);
    setSubmitError(null);
  };

  /* =========================
     HANDLE CHANGE
  ========================= */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handlePlatformChange = async (platformId: string) => {
    setForm((prev) => ({ ...prev, platform_id: platformId, format: "" }));
    if (platformId) await fetchFormats(platformId);
  };

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId],
    );
  };

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const session = await getSession();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      };

      const url = isEditMode
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-content/${contentToEdit?.id}`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-content`;

      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          ...form,
          published_at:
            form.status === "published"
              ? form.published_at || new Date().toISOString()
              : null,
          creative_unit_id: idea?.id ?? null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || t("common.errorSaving"));
        setLoading(false);
        return;
      }

      const contentId = isEditMode ? contentToEdit?.id : data.data?.id;

      // Guardar topics del contenido
      if (contentId) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-content-topics/${contentId}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({ topic_ids: selectedTopicIds }),
          },
        );

        // Si viene de una idea, vincularla también
        if (idea?.id && !isEditMode) {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-content-ideas/${contentId}`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify({ idea_ids: [idea.id] }),
            },
          );
        }
      }

      onCreated();
      onClose();
      resetForm();
    } catch (err) {
      console.error(err);
      setSubmitError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>
          {isEditMode
            ? t("contents.editContent")
            : idea
              ? t("contents.createFromCombination")
              : t("contents.createContent")}
        </h3>

        {idea && !isEditMode && (
          <div className="idea-context">
            <span className="idea-context__label">
              {t("contents.usingCombination")}
            </span>
            <strong className="idea-context__title">{idea.title}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* TITLE */}
          <input
            name="title"
            placeholder={t("contents.titlePlaceholder")}
            value={form.title}
            onChange={handleChange}
            required
          />

          {/* DESCRIPTION */}
          <textarea
            name="description"
            placeholder={t("contents.descriptionPlaceholder")}
            value={form.description}
            onChange={handleChange}
            maxLength={500}
            rows={3}
            style={{ resize: "vertical", minHeight: "72px", maxHeight: "120px" }}
          />
          <span style={{
            fontSize: "11px",
            color: "var(--color-text-tertiary)",
            display: "block",
            textAlign: "right",
            marginTop: "4px"
          }}>
            {(form.description ?? "").length}/500
          </span>

          {/* PLATFORM */}
          <select
            name="platform_id"
            value={form.platform_id}
            onChange={(e) => handlePlatformChange(e.target.value)}
            required
          >
            <option value="">{t("contents.selectPlatform")}</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* FORMAT */}
          <select
            name="format"
            value={form.format}
            onChange={handleChange}
            disabled={!form.platform_id}
            required
          >
            <option value="">{t("ideas.formatPlaceholder")}</option>
            {formats.map((f) => (
              <option key={f} value={f}>
                {t(`formats.${f}`, { defaultValue: f })}
              </option>
            ))}
          </select>

          {/* STATUS */}
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="draft">{t("status.draft")}</option>
            <option value="published">{t("status.published")}</option>
            <option value="archived">{t("status.archived")}</option>
          </select>

          {form.status === "published" && (
            <input
              type="datetime-local"
              name="published_at"
              value={form.published_at}
              onChange={handleChange}
            />
          )}

          {/* CONTENT ROLE */}
          <select
            name="content_role"
            value={form.content_role}
            onChange={handleChange}
          >
            <option value="">{t("contentRoles.selectRole")}</option>
            <option value="educational">{t("contentRoles.educational")}</option>
            <option value="inspirational">{t("contentRoles.inspirational")}</option>
            <option value="personal">{t("contentRoles.personal")}</option>
            <option value="promotional">{t("contentRoles.promotional")}</option>
            <option value="curated">{t("contentRoles.curated")}</option>
            <option value="sales">{t("contentRoles.sales")}</option>
          </select>

          {/* TOPICS */}
          {/* TOPICS */}
          {topics.length > 0 && (
            <div className="modal__topics">
              <p className="modal__label">{t("contents.topicsLabel")}</p>

              {/* SELECTED CHIPS */}
              {selectedTopicIds.length > 0 && (
                <div className="modal__topic-chips">
                  {selectedTopicIds.map((id) => {
                    const topic = topics.find((t) => t.id === id);
                    if (!topic) return null;
                    return (
                      <span key={id} className="topic-chip topic-chip--active">
                        {topic.name}
                        <button
                          type="button"
                          className="topic-chip__remove"
                          onClick={() => handleToggleTopic(id)}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* SEARCH INPUT */}
              <TopicCombobox
                topics={topics}
                selectedIds={selectedTopicIds}
                onToggle={handleToggleTopic}
              />
            </div>
          )}

          {/* LOCATION */}
          <input
            name="location"
            placeholder={t("contents.locationPlaceholder")}
            value={form.location}
            onChange={handleChange}
          />

          {/* REUSABLE */}
          <label className="checkbox">
            <input
              type="checkbox"
              name="is_reusable"
              checked={form.is_reusable}
              onChange={handleChange}
            />
            {t("contents.reusable")}
          </label>

          {submitError && <p className="modal__error">{submitError}</p>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="btn-secondary"
            >
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? isEditMode
                  ? t("contents.updating")
                  : t("contents.creating")
                : isEditMode
                  ? t("common.update")
                  : idea
                    ? t("contents.createFromCombination")
                    : t("common.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
