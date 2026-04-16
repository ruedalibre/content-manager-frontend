import { useEffect, useState } from "react";
import "./CreateContentModal.scss";
import { supabase } from "../../../supabaseClient.ts";

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
  platform_types: {
    id: string;
    name: string;
  };
};

type Idea = {
  id: string;
  title: string;
  description?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  contentToEdit?: ContentItem | null;
  idea?: Idea | null;
};

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
  /* =========================
     FORM STATE
  ========================= */

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

  const [creativeUnitId, setCreativeUnitId] = useState<string | null>(null);

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = !!contentToEdit;

  /* =========================
     FETCH PLATFORMS
  ========================= */

  useEffect(() => {
    if (!isOpen) return;

    const loadPlatforms = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers = {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        };

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/platforms`,
          { headers },
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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers = {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/platform-formats?platform_id=${platformId}`,
        { headers },
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
        published_at: contentToEdit.published_at ?? "",
        content_role: contentToEdit.content_role ?? "",
      });

      setCreativeUnitId(null);

      fetchFormats(contentToEdit.platform_id);
    } else {
      resetForm();
    }
  }, [contentToEdit, idea]);

  /* =========================
     PREFILL FROM IDEA 🔥
========================= */

  useEffect(() => {
    if (!idea || isEditMode) return;

    setForm((prev) => ({
      ...prev,
      title: idea.title,
      description: idea.description ?? "",
    }));

    setCreativeUnitId(idea.id);
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
    setCreativeUnitId(null);
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

  /* =========================
     PLATFORM CHANGE
========================= */

  const handlePlatformChange = async (platformId: string) => {
    setForm((prev) => ({
      ...prev,
      platform_id: platformId,
      format: "",
    }));

    if (platformId) {
      await fetchFormats(platformId);
    }
  };

  /* =========================
     SUBMIT
========================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      const url = isEditMode
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-content/${contentToEdit?.id}`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-content`;

      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          ...form,
          published_at:
            form.status === "published"
              ? form.published_at || new Date().toISOString()
              : null,
          creative_unit_id: idea?.id ?? creativeUnitId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        setSubmitError(data.error || "Error saving content");
        setLoading(false);
        return;
      }

      onCreated();
      onClose();
      resetForm();
    } catch (err) {
      console.error(err);
      setSubmitError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     GUARD
========================= */

  if (!isOpen) return null;

  /* =========================
     RENDER
========================= */

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>
          {isEditMode
            ? "Edit Content"
            : idea
              ? "Create from Idea"
              : "Create Content"}
        </h3>

        {/* 🔥 CONTEXT */}

        {idea && !isEditMode && (
          <div className="idea-context">
            <span className="idea-context__label">
              Creating content from idea
            </span>

            <strong className="idea-context__title">{idea.title}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* TITLE */}

          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            required
          />

          {/* DESCRIPTION */}

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />

          {/* PLATFORM */}

          <select
            name="platform_id"
            value={form.platform_id}
            onChange={(e) => handlePlatformChange(e.target.value)}
            required
          >
            <option value="">Select platform</option>

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
            <option value="">Select format</option>

            {formats.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* STATUS */}

          <select name="status" value={form.status} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          {form.status === "published" && (
            <input
              type="datetime-local"
              name="published_at"
              value={form.published_at}
              onChange={handleChange}
              placeholder="Published date"
            />
          )}

          {/* CONTENT ROLE */}

          <select
            name="content_role"
            value={form.content_role}
            onChange={handleChange}
          >
            <option value="">Select role (optional)</option>
            <option value="educational">Educational</option>
            <option value="inspirational">Inspirational</option>
            <option value="personal">Personal</option>
            <option value="promotional">Promotional</option>
            <option value="curated">Curated</option>
          </select>

          {/* LOCATION */}

          <input
            name="location"
            placeholder="Location"
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
            Reusable
          </label>

          {/* ACTIONS */}

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
              Cancel
            </button>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update"
                  : idea
                    ? "Create from Idea"
                    : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
