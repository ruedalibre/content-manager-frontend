import { useState } from "react";
import "./CreateContentModal.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void; // refresh table
};

export default function CreateContentModal({
  isOpen,
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState({
    platform_id: "",
    title: "",
    description: "",
    format: "post",
    status: "draft",
    location: "",
    is_reusable: false,
    published_at: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async () => {
    const headers = {
      Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    };

    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-content`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      },
    );

    onCreated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">

        <h2>Create Content</h2>

        {/* Platform */}
        <select
          name="platform_id"
          onChange={handleChange}
        >
          <option value="">
            Select platform
          </option>
          <option value="1">Instagram</option>
          <option value="2">TikTok</option>
          <option value="3">YouTube</option>
          <option value="4">X</option>
        </select>

        {/* Title */}
        <input
          name="title"
          placeholder="Title"
          onChange={handleChange}
        />

        {/* Description */}
        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
        />

        {/* Format */}
        <select
          name="format"
          onChange={handleChange}
        >
          <option value="post">Post</option>
          <option value="reel">Reel</option>
          <option value="story">Story</option>
          <option value="video">Video</option>
          <option value="carousel">Carousel</option>
        </select>

        {/* Status */}
        <select
          name="status"
          onChange={handleChange}
        >
          <option value="draft">Draft</option>
          <option value="published">
            Published
          </option>
          <option value="archived">
            Archived
          </option>
        </select>

        {/* Location */}
        <input
          name="location"
          placeholder="Location"
          onChange={handleChange}
        />

        {/* Reusable */}
        <label>
          <input
            type="checkbox"
            name="is_reusable"
            onChange={handleChange}
          />
          Reusable
        </label>

        {/* Published date */}
        {form.status === "published" && (
          <input
            type="date"
            name="published_at"
            onChange={handleChange}
          />
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button onClick={onClose}>
            Cancel
          </button>

          <button
            className="btn-primary"
            onClick={handleSubmit}
          >
            Create
          </button>
        </div>

      </div>
    </div>
  );
}
