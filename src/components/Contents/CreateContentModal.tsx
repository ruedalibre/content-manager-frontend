import { useEffect, useState } from "react";
import "./CreateContentModal.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

type Platform = {
  id: string;
  name: string;
};

export default function CreateContentModal({
  isOpen,
  onClose,
  onCreated,
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

  const [loading, setLoading] = useState(false);

  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    };

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/platforms`, {
      headers,
    })
      .then((res) => res.json())
      .then(setPlatforms)
      .catch(console.error);
  }, []);

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

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    };

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/platforms`, {
      headers,
    })
      .then((res) => res.json())
      .then(setPlatforms)
      .catch(console.error);
  }, []);

  if (!isOpen) return null;

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert("Error creating content");
        setLoading(false);
        return;
      }

      /* SUCCESS */

      onCreated(); // refresh table
      onClose(); // close modal

      setForm({
        title: "",
        description: "",
        platform_id: "",
        format: "post",
        status: "draft",
        location: "",
        is_reusable: false,
      });
    } catch (err) {
      console.error(err);
      alert("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create Content</h3>

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

          {/* PLATFORM ID (MVP TEXT) */}

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
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
