import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import "./CreateIdeaModal.scss";

/* =========================
   TYPES
========================= */

type Idea = {
  id: string;
  title: string;
  description: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  ideaToEdit?: Idea | null;
};

/* =========================
   COMPONENT
========================= */

export default function CreateIdeaModal({
  isOpen,
  onClose,
  onCreated,
  ideaToEdit,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);

  const isEditMode = !!ideaToEdit;

  /* =========================
     PREFILL EDIT MODE
  ========================= */

  useEffect(() => {
    if (ideaToEdit) {
      setTitle(ideaToEdit.title);
      setDescription(ideaToEdit.description ?? "");
    } else {
      resetForm();
    }
  }, [ideaToEdit]);

  /* =========================
     RESET
  ========================= */

  const resetForm = () => {
    setTitle("");
    setDescription("");
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
      };

      const url = isEditMode
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-idea/${ideaToEdit?.id}`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-idea`;

      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          title,
          description,
          source: "manual",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert("Error saving idea");
        setLoading(false);
        return;
      }

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
        <h3>{isEditMode ? "Edit Idea" : "Create Idea"}</h3>

        <form onSubmit={handleSubmit}>
          {/* TITLE */}

          <input
            placeholder="Idea title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* DESCRIPTION */}

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

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
