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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(false);

  const isEditMode = !!ideaToEdit;

  /* =========================
     SUGGESTIONS (create mode)
  ========================= */

  useEffect(() => {
    if (isOpen && !isEditMode) {
      const loadSuggestions = async () => {
        try {
          setLoadingSuggestions(true);
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ideas`,
            { headers: { Authorization: `Bearer ${session?.access_token}` } }
          );
          if (!res.ok) return;
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
        } catch {
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      };
      loadSuggestions();
    }

    if (!isOpen) setSuggestions([]);
  }, [isOpen, isEditMode]);

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
    setSelectedSuggestion(false);
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
          source: selectedSuggestion ? "generated" : "manual",
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
          {/* SUGGESTIONS (create mode only) */}

          {!isEditMode && (
            <div className="create-idea-modal__suggestions">
              {loadingSuggestions ? (
                <div className="create-idea-modal__suggestions-loading">
                  <span>Generating ideas for you...</span>
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  <span className="create-idea-modal__suggestions-label">
                    Suggestions based on your content
                  </span>
                  <div className="create-idea-modal__suggestions-chips">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`create-idea-modal__chip${title === s ? " create-idea-modal__chip--selected" : ""}`}
                        onClick={() => {
                          if (title === s) {
                            setTitle("");
                            setSelectedSuggestion(false);
                          } else {
                            setTitle(s);
                            setSelectedSuggestion(true);
                          }
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* TITLE */}

          <input
            placeholder="Idea title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (selectedSuggestion) setSelectedSuggestion(false);
            }}
            required
          />

          {/* DESCRIPTION */}

          <textarea
            placeholder="Add some context or additional details (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            {description.length}/500
          </span>

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
