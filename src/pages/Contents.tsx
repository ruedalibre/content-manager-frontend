import { useEffect, useState } from "react";
import CreateContentModal from "../components/Contents/CreateContentModal";
import "./Contents.scss";

/* =========================
   TYPES
========================= */

type ContentItem = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  platform_name: string;
  platform_id: string; // ← necesario para editar
  format: string;
  status: string;
  location: string | null;
  is_reusable: boolean;
  created_at: string;
  published_at: string | null;
};

type ApiResponse = {
  page: number;
  limit: number;
  results: ContentItem[];
};

/* =========================
   COMPONENT
========================= */

export default function Contents() {
  /* =========================
     STATES
  ========================= */

  const [contents, setContents] = useState<ContentItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [contentToEdit, setContentToEdit] = useState<ContentItem | null>(null);

  const [page] = useState(1);

  const [contentToDelete, setContentToDelete] = useState<ContentItem | null>(
    null,
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [lastDeleted, setLastDeleted] = useState<ContentItem | null>(null);

  const [showToast, setShowToast] = useState(false);

  const [undoTimeout, setUndoTimeout] = useState<number | null>(null);

  const [isRestoring, setIsRestoring] = useState(false);

  /* =========================
     FETCH FUNCTION
  ========================= */

  const fetchContents = async () => {
    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-contents-history?page=${page}&limit=10`,
        { headers },
      );

      const data: ApiResponse = await res.json();

      setContents(data.results || []);
    } catch (err) {
      console.error("Contents fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     INITIAL FETCH
  ========================= */

  useEffect(() => {
    fetchContents();
  }, []);

  /* =========================
     EDIT HANDLER
  ========================= */

  const handleEdit = (content: ContentItem) => {
    setContentToEdit(content);
    setIsModalOpen(true);
  };

  /* =========================
     CREATE HANDLER
  ========================= */

  const handleCreate = () => {
    setContentToEdit(null);
    setIsModalOpen(true);
  };

  /* =========================
     DELETE HANDLER
  ========================= */

  const handleDeleteClick = (content: ContentItem) => {
    setContentToDelete(content);
    setIsDeleteModalOpen(true);
  };

  /* =========================
     CONFIRM DELETE HANDLER
  ========================= */

  const handleConfirmDelete = async () => {
    if (!contentToDelete) return;

    try {
      setIsDeleting(true);

      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-content/${contentToDelete.id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (!res.ok) {
        const error = await res.json();
        console.error("Delete error:", error);
        return;
      }

      // 🔥 Mutación optimista
      setContents((prev) =>
        prev.filter((item) => item.id !== contentToDelete.id),
      );

      // Guardamos para posible undo
      setLastDeleted(contentToDelete);
      // Mostrar toast
      setShowToast(true);

      // Auto cerrar después de 6s
      const timeout = window.setTimeout(() => {
        setShowToast(false);
        setLastDeleted(null);
      }, 6000);

      setUndoTimeout(timeout);

      // Cerrar modal
      setIsDeleteModalOpen(false);
      setContentToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  /* =========================
     UNDO HANDLER
  ========================= */

  const handleUndo = async () => {
    if (!lastDeleted) return;

    try {
      setIsRestoring(true);

      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }

      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/restore-content/${lastDeleted.id}`,
        {
          method: "POST",
          headers,
        },
      );

      if (!res.ok) {
        const error = await res.json();
        console.error("Restore error:", error);
        return;
      }

      // Restauración optimista
      setContents((prev) => [lastDeleted, ...prev]);

      setShowToast(false);
      setLastDeleted(null);
    } catch (err) {
      console.error("Undo failed:", err);
    } finally {
      setIsRestoring(false);
    }
  };

  /* =========================
     LOADING STATE
  ========================= */

  if (loading) {
    return <p>Loading contents...</p>;
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <>
      <div className="contents-page">
        {/* =====================
            HEADER
        ===================== */}

        <div className="contents-page__header">
          <h2 className="page__title">Contents</h2>

          <button className="btn-primary" onClick={handleCreate}>
            + New Content
          </button>
        </div>

        {/* =====================
            FILTERS (MVP)
        ===================== */}

        <div className="contents-filters">
          <input
            type="text"
            placeholder="Search content..."
            className="contents-filters__search"
          />

          <select className="contents-filters__select">
            <option>All Platforms</option>
          </select>

          <select className="contents-filters__select">
            <option>All Status</option>
          </select>
        </div>

        {/* =====================
            TABLE
        ===================== */}

        <div className="contents-table-wrapper">
          <table className="contents-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Platform</th>
                <th>Format</th>
                <th>Status</th>
                <th>Reusable</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {contents.length === 0 && (
                <tr>
                  <td colSpan={7}>No contents found</td>
                </tr>
              )}

              {contents.map((item) => (
                <tr key={item.id}>
                  {/* TITLE */}

                  <td>
                    <div className="content-title">
                      <strong>{item.title}</strong>

                      {item.description && <span>{item.description}</span>}
                    </div>
                  </td>

                  {/* PLATFORM */}

                  <td>{item.platform_name}</td>

                  {/* FORMAT */}

                  <td>{item.format}</td>

                  {/* STATUS */}

                  <td>
                    <span className={`status ${item.status}`}>
                      {item.status}
                    </span>
                  </td>

                  {/* REUSABLE */}

                  <td>{item.is_reusable ? "Yes" : "No"}</td>

                  {/* CREATED */}

                  <td>{new Date(item.created_at).toLocaleDateString()}</td>

                  {/* ACTIONS */}

                  <td className="actions-cell">
                    <button
                      className="btn-link"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn-link btn-link--danger"
                      onClick={() => handleDeleteClick(item)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =====================
            PAGINATION
        ===================== */}

        <div className="contents-pagination">
          <button>{"<"}</button>
          <span>Page 1</span>
          <button>{">"}</button>
        </div>

        {/* =====================
            MODAL
        ===================== */}

        <CreateContentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreated={fetchContents}
          contentToEdit={contentToEdit}
        />

        {isDeleteModalOpen && contentToDelete && (
          <div className="delete-modal-overlay">
            <div className="delete-modal">
              <h3>Delete content</h3>

              <p>
                This will permanently remove
                <strong> {contentToDelete.title} </strong>
                from your library.
              </p>

              <div className="delete-modal__actions">
                <button
                  className="btn-link"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setContentToDelete(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="btn-primary btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showToast && lastDeleted && (
          <div className="toast">
            <span>Content deleted.</span>

            <button
              className="toast__undo"
              onClick={handleUndo}
              disabled={isRestoring}
            >
              {isRestoring ? "Restoring..." : "Undo"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
