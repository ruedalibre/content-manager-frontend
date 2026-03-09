import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import CreateContentModal from "../components/Contents/CreateContentModal";
import { supabase } from "../supabaseClient.ts";
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

type Platform = {
  id: string;
  name: string;
};

type OutletContext = {
  setTopbarContext: (value: string | null) => void;
};

/* =========================
   COMPONENT
========================= */

export default function Contents() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTopbarContext } = useOutletContext<OutletContext>();

  const [platformOptions, setPlatformOptions] = useState<Platform[]>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
     SEARCH DEBOUNCE
  ========================= */

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  /* =========================
     FETCH CONTENTS
  ========================= */

  const fetchContents = async () => {
    try {
      setLoading(true);
      setTopbarContext("Loading...");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers = {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      };

      let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-contents-history?page=${page}&limit=${limit}`;

      if (debouncedSearch)
        url += `&search=${encodeURIComponent(debouncedSearch)}`;

      if (platformFilter) url += `&platform_id=${platformFilter}`;

      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url, { headers });

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
  }, [page, debouncedSearch, platformFilter, statusFilter]);

  /* =========================
     FETCH PLATFORMS
  ========================= */

  useEffect(() => {
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

        setPlatformOptions(data);
      } catch (err) {
        console.error("Platform fetch error:", err);
      }
    };

    loadPlatforms();
  }, []);

  /* =========================
     STATUS OPTIONS
  ========================= */

  const statusOptions = useMemo(() => {
    const set = new Set(contents.map((c) => c.status));
    return Array.from(set);
  }, [contents]);

  /* =========================
     CLEAR FILTERS
  ========================= */

  const clearFilters = () => {
    setSearch("");
    setPlatformFilter("");
    setStatusFilter("");
    setPage(1);
  };

  /* =========================
     MICRO CONTEXT
  ========================= */

  useEffect(() => {
    if (!loading) {
      setTopbarContext(
        total === 0 ? "No contents yet" : `${total} total contents`,
      );
    }

    return () => {
      setTopbarContext(null);
    };
  }, [loading, total, setTopbarContext]);

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
     DELETE
  ========================= */

  const handleDeleteClick = (content: ContentItem) => {
    setContentToDelete(content);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contentToDelete) return;

    try {
      setIsDeleting(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers = {
        Authorization: `Bearer ${session?.access_token}`,
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

      setTotal((prev) => Math.max(prev - 1, 0));
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

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (undoTimeout) clearTimeout(undoTimeout);

      const headers = {
        Authorization: `Bearer ${session?.access_token}`,
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
     SKELETON ROWS
  ========================= */

  const skeletonRows = Array.from({ length: 6 });

  return (
    <>
      <div className="contents-page">

        <div className="contents-page__header">
          <button className="btn-primary" onClick={handleCreate}>
            + New Content
          </button>
        </div>

        {/* FILTERS */}

        <div className="contents-filters">

          <input
            type="text"
            placeholder="Search content..."
            className="contents-filters__search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            className="contents-filters__select"
            value={platformFilter}
            onChange={(e) => {
              setPlatformFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Platforms</option>

            {platformOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className="contents-filters__select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>

            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button className="btn-secondary" onClick={clearFilters}>
            Clear
          </button>

        </div>

        <div className="contents-results">
          Showing {contents.length} of {total} contents
        </div>

        {/* TABLE */}

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

              {loading &&
                skeletonRows.map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    <td colSpan={7}>
                      <div className="skeleton-line"></div>
                    </td>
                  </tr>
                ))}

              {!loading && contents.length === 0 && (
                <tr>
                  <td colSpan={7}>No contents found</td>
                </tr>
              )}

              {!loading &&
                contents.map((item) => (
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

        {/* PAGINATION */}

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