import { useEffect, useState } from "react";
import "./CreateContentModal.scss";
import { supabase } from "../../supabaseClient.ts";

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
};

type Platform = {
  id: string;
  name: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  contentToEdit?: ContentItem | null;
};

/* =========================
   COMPONENT
========================= */

export default function CreateContentModal({
  isOpen,
  onClose,
  onCreated,
  contentToEdit,
}: Props) {
  /* =========================
     FORM STATE
  ========================= */

  const [form, setForm] = useState({
    title: "",
    description: "",
    platform_id: "",
    format: "post",
    status: "draft",
    location: "",
    is_reusable: false,
  });

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!contentToEdit;

  console.log("Submitting form:", form);

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

        const data = await res.json();

        setPlatforms(data);
      } catch (err) {
        console.error("Platform fetch error:", err);
      }
    };

    loadPlatforms();
  }, [isOpen]);

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
      });
    } else {
      resetForm();
    }
  }, [contentToEdit]);

  /* =========================
     RESET FORM
  ========================= */

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      platform_id: "",
      format: "post",
      status: "draft",
      location: "",
      is_reusable: false,
    });
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
     SUBMIT (CREATE / UPDATE)
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
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      alert("Error saving content");
      setLoading(false);
      return;
    }

    /* SUCCESS */

    onCreated();
    onClose();
    resetForm();
  } catch (err) {
    console.error(err);
    alert("Unexpected error");
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
        <h3>{isEditMode ? "Edit Content" : "Create Content"}</h3>

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
            onChange={handleChange}
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

          <select name="format" value={form.format} onChange={handleChange}>
            <option value="post">Post</option>
            <option value="reel">Reel</option>
            <option value="story">Story</option>
            <option value="video">Video</option>
            <option value="carousel">Carousel</option>
          </select>

          {/* STATUS */}

          <select name="status" value={form.status} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
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
                  : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
