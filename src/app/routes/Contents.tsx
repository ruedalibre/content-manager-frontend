import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import CreateContentModal from "../../features/contents/modals/CreateContentModal.tsx";
import { supabase } from "../../supabaseClient.ts";
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
  content_role: string | null;
};

type Platform = {
  id: string;
  name: string;
};

type OutletContext = {
  setTopbarContext: (value: string | null) => void;
};

type Idea = {
  id: string;
  title: string;
  description: string | null;
  tenant_id?: string;
  created_at?: string;
  source?: string;
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
  const [roleFilter, setRoleFilter] = useState("");

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

  const [toastMessage, setToastMessage] = useState<string>("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get("idea");

  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  /* =========================
     TOAST
  ========================= */

  const showSuccess = (message: string) => {
    setToastMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  /* =========================
     LOAD IDEA FROM QUERY PARAM
  ========================= */
  useEffect(() => {
    const loadIdea = async () => {
      if (!ideaId) return;

      const { data, error } = await supabase
        .from("creative_units")
        .select("*")
        .eq("id", ideaId)
        .single();

      if (error) {
        console.error("Error loading idea:", error);
        return;
      }

      setSelectedIdea(data);
      setContentToEdit(null); // importante
      setIsModalOpen(true); // 🔥 abrir el mismo modal
    };

    loadIdea();
  }, [ideaId]);

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
      };

      let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-contents-history?page=${page}&limit=${limit}`;

      if (debouncedSearch)
        url += `&search=${encodeURIComponent(debouncedSearch)}`;

      if (platformFilter) url += `&platform_id=${platformFilter}`;

      if (roleFilter) url += `&content_role=${roleFilter}`;

      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url, { headers });

      const data = await res.json();

      setContents(data.results || []);
      setTotal(data.total || 0);
      setAvailableStatuses(data.availableStatuses || []);
    } catch (err) {
      console.error("Contents fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [page, debouncedSearch, platformFilter, statusFilter, roleFilter]);

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

  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);

  /* =========================
     CLEAR FILTERS
  ========================= */

  const clearFilters = () => {
    setSearch("");
    setPlatformFilter("");
    setStatusFilter("");
    setRoleFilter("");
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
    setSelectedIdea(null); // 🔥 importante
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setContentToEdit(null);
    setSelectedIdea(null);
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

      setLastDeleted(contentToDelete);
      setShowToast(true);

      const timeout = window.setTimeout(() => {
        setShowToast(false);
        setLastDeleted(null);
      }, 6000);

      setUndoTimeout(timeout);

      setIsDeleteModalOpen(false);
      setContentToDelete(null);

      // Recalcular página antes de refrescar
      const newTotal = total - 1;
      const newTotalPages = Math.ceil(newTotal / limit);
      if (page > newTotalPages && newTotalPages > 0) {
        setPage(newTotalPages);
      } else {
        await fetchContents();
      }
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

            {availableStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="contents-filters__select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            <option value="educational">Educational</option>
            <option value="inspirational">Inspirational</option>
            <option value="personal">Personal</option>
            <option value="promotional">Promotional</option>
            <option value="curated">Curated</option>
          </select>

          <button
            type="button"
            className="btn-secondary"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        <div className="contents-toolbar">
          <div className="contents-results">
            <span>
              Showing {contents.length} of {total} contents
            </span>
          </div>
        </div>
        <div className="contents-pagination">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(1)}
            title="First page"
          >
            «
          </button>
          <button
            type="button"
            disabled={page <= 5}
            onClick={() => setPage((prev) => Math.max(prev - 5, 1))}
            title="Back 5 pages"
          >
            ‹‹
          </button>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            title="Previous page"
          >
            ‹
          </button>
          <span className="pagination__indicator">
            <input
              type="number"
              min={1}
              max={totalPages || 1}
              value={page}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= totalPages) setPage(val);
              }}
              className="pagination__input"
            />
            <span className="pagination__of">of {totalPages || 1}</span>
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            title="Next page"
          >
            ›
          </button>
          <button
            type="button"
            disabled={page > totalPages - 5}
            onClick={() => setPage((prev) => Math.min(prev + 5, totalPages))}
            title="Forward 5 pages"
          >
            ››
          </button>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            title="Last page"
          >
            »
          </button>
        </div>

        {/* TABLE */}

        <div className="contents-table-wrapper">
          <table className="contents-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Platform</th>
                <th>Format</th>
                <th>Role</th>
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
                      {item.content_role ? (
                        <span className={`role role--${item.content_role}`}>
                          {item.content_role}
                        </span>
                      ) : (
                        <span className="role role--none">—</span>
                      )}
                    </td>

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

        {/* PAGINATION */}

        <div className="contents-pagination">
          {/* Primera página */}
          <button
            disabled={page === 1}
            onClick={() => setPage(1)}
            title="First page"
          >
            {"«"}
          </button>

          {/* Retroceder 5 páginas */}
          <button
            disabled={page <= 5}
            onClick={() => setPage((prev) => Math.max(prev - 5, 1))}
            title="Back 5 pages"
          >
            {"‹‹"}
          </button>

          {/* Página anterior */}
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            title="Previous page"
          >
            {"‹"}
          </button>

          {/* Indicador de página con input */}
          <span className="pagination__indicator">
            <input
              type="number"
              min={1}
              max={totalPages || 1}
              value={page}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= totalPages) {
                  setPage(val);
                }
              }}
              className="pagination__input"
            />
            <span>of {totalPages || 1}</span>
          </span>

          {/* Página siguiente */}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            title="Next page"
          >
            {"›"}
          </button>

          {/* Avanzar 5 páginas */}
          <button
            disabled={page > totalPages - 5}
            onClick={() => setPage((prev) => Math.min(prev + 5, totalPages))}
            title="Forward 5 pages"
          >
            {"››"}
          </button>

          {/* Última página */}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            title="Last page"
          >
            {"»"}
          </button>
        </div>

        <CreateContentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setContentToEdit(null);
            setSelectedIdea(null);
          }}
          onCreated={() => {
            const isEditing = !!contentToEdit;
            fetchContents();
            showSuccess(
              isEditing
                ? "Content updated successfully"
                : "Content created successfully",
            );
          }}
          contentToEdit={contentToEdit}
          idea={selectedIdea}
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

        {showSuccessToast && (
          <div className="toast toast--success">
            <span>✓ {toastMessage}</span>
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
