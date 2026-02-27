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
  platform_id: string;
  format: string;
  status: string;
  location: string | null;
  is_reusable: boolean;
  created_at: string;
  published_at: string | null;
};

/* =========================
   COMPONENT
========================= */

export default function Contents() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contentToEdit, setContentToEdit] = useState<ContentItem | null>(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const totalPages = Math.ceil(total / limit);

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

      const data = await res.json();
      setContents(data.results || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Contents fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [page]);

  /* =========================
     CREATE / EDIT
  ========================= */

  const handleEdit = (content: ContentItem) => {
    setContentToEdit(content);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setContentToEdit(null);
    setIsModalOpen(true);
  };

  /* =========================
     DELETE FLOW
  ========================= */

  const handleDeleteClick = (content: ContentItem) => {
    setContentToDelete(content);
    setIsDeleteModalOpen(true);
  };

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
        { method: "DELETE", headers },
      );

      if (!res.ok) {
        const error = await res.json();
        console.error("Delete error:", error);
        return;
      }

      // Optimistic removal
      setContents((prev) =>
        prev.filter((item) => item.id !== contentToDelete.id),
      );

      setLastDeleted(contentToDelete);
      setShowToast(true);

      const timeout = window.setTimeout(() => {
        setShowToast(false);
        setLastDeleted(null);
      }, 6000);

      setUndoTimeout(timeout);

      setIsDeleteModalOpen(false);
      setContentToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  /* =========================
     RESTORE
  ========================= */

  const handleUndo = async () => {
    if (!lastDeleted) return;

    try {
      setIsRestoring(true);

      if (undoTimeout) clearTimeout(undoTimeout);

      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/restore-content/${lastDeleted.id}`,
        { method: "POST", headers },
      );

      if (!res.ok) {
        const error = await res.json();
        console.error("Restore error:", error);
        return;
      }

      // Re-sync with backend
      await fetchContents();

      setShowToast(false);
      setLastDeleted(null);
    } catch (err) {
      console.error("Undo failed:", err);
    } finally {
      setIsRestoring(false);
    }
  };

  /* =========================
     LOADING
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
        <div className="contents-page__header">
          <h2 className="page__title">Contents</h2>
          <button className="btn-primary" onClick={handleCreate}>
            + New Content
          </button>
        </div>

        {/* Filters */}
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

        {/* Table */}
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
                  <td>
                    <div className="content-title">
                      <strong>{item.title}</strong>
                      {item.description && <span>{item.description}</span>}
                    </div>
                  </td>

                  <td>{item.platform_name}</td>
                  <td>{item.format}</td>

                  <td>
                    <span className={`status ${item.status}`}>
                      {item.status}
                    </span>
                  </td>

                  <td>{item.is_reusable ? "Yes" : "No"}</td>

                  <td>{new Date(item.created_at).toLocaleDateString()}</td>

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

        {/* Pagination */}
        <div className="contents-pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            {"<"}
          </button>

          <span>
            Page {page} of {totalPages || 1}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {">"}
          </button>
        </div>

        {/* Create/Edit Modal */}
        <CreateContentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreated={fetchContents}
          contentToEdit={contentToEdit}
        />

        {/* Delete Modal */}
        {isDeleteModalOpen && contentToDelete && (
          <div className="delete-modal-overlay">
            <div className="delete-modal">
              <h3>Delete content</h3>
              <p>
                This will permanently remove{" "}
                <strong>{contentToDelete.title}</strong>
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

        {/* Toast */}
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
