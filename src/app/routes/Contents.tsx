import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import CreateContentModal from "../../features/contents/modals/CreateContentModal.tsx";
import { supabase } from "../../supabaseClient.ts";
import StepsGuide from "../../components/ui/StepsGuide";
import { useWorkspace } from "../../features/workspace/hooks/useWorkspace.tsx";
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
  has_ideas: boolean;
  has_session: boolean;
  created_at: string;
  published_at: string | null;
  archived_at: string | null;
  content_role: string | null;
  topics?: { id: string; name: string }[];
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
  const { t } = useTranslation();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTopbarContext } = useOutletContext<OutletContext>();

  const { currentWorkspaceId } = useWorkspace();

  const [platformOptions, setPlatformOptions] = useState<Platform[]>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [topicOptions, setTopicOptions] = useState<
    { id: string; name: string }[]
  >([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contentToEdit, setContentToEdit] = useState<ContentItem | null>(null);

  const [addIdeaContent, setAddIdeaContent] = useState<ContentItem | null>(
    null,
  );
  const [addIdeaTitle, setAddIdeaTitle] = useState("");
  const [addIdeaDescription, setAddIdeaDescription] = useState("");
  const [addIdeaSaving, setAddIdeaSaving] = useState(false);
  const [addIdeaError, setAddIdeaError] = useState<string | null>(null);

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
  const editId = searchParams.get("edit");

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
      if (!ideaId || !currentWorkspaceId) return;

      const { data, error } = await supabase
        .from("creative_units")
        .select("*")
        .eq("id", ideaId)
        .eq("workspace_id", currentWorkspaceId)
        .single();

      if (error) {
        console.error("Error loading idea:", error);
        return;
      }

      setSelectedIdea(data);
      setContentToEdit(null);
      setIsModalOpen(true); 
    };

    loadIdea();
  }, [ideaId, currentWorkspaceId]);

  /* =========================
     OPEN EDIT FROM ?edit= QUERY PARAM
  ========================= */
  useEffect(() => {
    const loadContentForEdit = async () => {
      if (!editId || !currentWorkspaceId) return;
      const { data } = await supabase
        .from("contents")
        .select(
          "id, user_id, title, description, platform_id, format, status, location, published_at, content_role",
        )
        .eq("id", editId)
        .eq("workspace_id", currentWorkspaceId)
        .eq("is_deleted", false)
        .single();
      if (data) {
        setContentToEdit(data as ContentItem);
        setSelectedIdea(null);
        setIsModalOpen(true);
      }
    };
    loadContentForEdit();
  }, [editId, currentWorkspaceId]);

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
    if (!currentWorkspaceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setTopbarContext(t("common.loading"));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers = {
        Authorization: `Bearer ${session?.access_token}`,
      };

      let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-contents-history?page=${page}&limit=${limit}&workspace_id=${currentWorkspaceId}`;

      if (debouncedSearch)
        url += `&search=${encodeURIComponent(debouncedSearch)}`;

      if (platformFilter) url += `&platform_id=${platformFilter}`;

      if (roleFilter) url += `&content_role=${roleFilter}`;

      if (topicFilter) url += `&topic_id=${topicFilter}`;

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
  }, [
    page,
    debouncedSearch,
    platformFilter,
    statusFilter,
    roleFilter,
    topicFilter,
    currentWorkspaceId,
  ]);

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
     FETCH TOPICS
     (sin cambios — Topics sigue siendo tenant-wide hasta Phase 3.6)
  ========================= */
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-topics`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } },
        );
        const data: { id: string; name: string }[] = await res.json();
        setTopicOptions(data ?? []);
      } catch (err) {
        console.error("Topics fetch error:", err);
      }
    };
    loadTopics();
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
    setTopicFilter("");
    setPage(1);
  };

  /* =========================
     MICRO CONTEXT
  ========================= */

  useEffect(() => {
    setTopbarContext(t("contents.subtitle"));
    return () => setTopbarContext(null);
  }, [setTopbarContext, t]);

  /* =========================
     CREATE / EDIT
  ========================= */

  const handleEdit = (content: ContentItem) => {
    setContentToEdit(content);
    setSelectedIdea(null);
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
    if (!contentToDelete || !currentWorkspaceId) return;

    try {
      setIsDeleting(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers = {
        Authorization: `Bearer ${session?.access_token}`,
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-content/${contentToDelete.id}?workspace_id=${currentWorkspaceId}`,
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
    if (!lastDeleted || !currentWorkspaceId) return;

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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/restore-content/${lastDeleted.id}?workspace_id=${currentWorkspaceId}`,
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
     ADD TO IDEAS LIBRARY
  ========================= */

  const handleAddToIdeasLibrary = async () => {
    if (!addIdeaContent || !addIdeaTitle.trim() || !currentWorkspaceId) return;
    setAddIdeaSaving(true);
    setAddIdeaError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-idea-from-content`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content_id: addIdeaContent.id,
            title: addIdeaTitle.trim(),
            description: addIdeaDescription.trim() || undefined,
            workspace_id: currentWorkspaceId,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create idea");

      // Actualizar el item en la lista local sin recargar
      setContents((prev) =>
        prev.map((c) =>
          c.id === addIdeaContent.id ? { ...c, has_ideas: true } : c,
        ),
      );

      setAddIdeaContent(null);
      setAddIdeaTitle("");
      setAddIdeaDescription("");
      showSuccess(t("contents.saveIdea"));
    } catch (err) {
      setAddIdeaError(
        err instanceof Error ? err.message : "Failed to create idea",
      );
    } finally {
      setAddIdeaSaving(false);
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
          <div className="contents-top-bar">
            <button
              type="button"
              className="btn-primary"
              onClick={handleCreate}
            >
              {t("contents.newContent")}
            </button>
            <StepsGuide namespace="contents" />
          </div>
        </div>

        {/* FILTERS */}

        <div className="contents-filters">
          <input
            type="text"
            placeholder={t("contents.searchPlaceholder")}
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
            <option value="">{t("contents.allPlatforms")}</option>

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
            <option value="">{t("contents.allStatus")}</option>

            {availableStatuses.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`, { defaultValue: s })}
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
            <option value="">{t("contents.allRoles")}</option>
            <option value="educational">{t("contentRoles.educational")}</option>
            <option value="inspirational">
              {t("contentRoles.inspirational")}
            </option>
            <option value="personal">{t("contentRoles.personal")}</option>
            <option value="promotional">{t("contentRoles.promotional")}</option>
            <option value="curated">{t("contentRoles.curated")}</option>
            <option value="sales">{t("contentRoles.sales")}</option>
          </select>

          <select
            className="contents-filters__select"
            value={topicFilter}
            onChange={(e) => {
              setTopicFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("contents.allTopics")}</option>
            {topicOptions.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-secondary"
            onClick={clearFilters}
          >
            {t("contents.clearFilters")}
          </button>
        </div>

        <div className="contents-toolbar">
          <div className="contents-results">
            <span>
              {t("contents.showing", { count: contents.length, total: total })}
            </span>
          </div>
        </div>
        <div className="contents-pagination">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(1)}
            title={t("contents.firstPage")}
          >
            «
          </button>
          <button
            type="button"
            disabled={page <= 5}
            onClick={() => setPage((prev) => Math.max(prev - 5, 1))}
            title={t("contents.back5")}
          >
            ‹‹
          </button>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            title={t("contents.prevPage")}
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
            <span className="pagination__of">
              {t("contents.pageOf")} {totalPages || 1}
            </span>
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            title={t("contents.nextPage")}
          >
            ›
          </button>
          <button
            type="button"
            disabled={page > totalPages - 5}
            onClick={() => setPage((prev) => Math.min(prev + 5, totalPages))}
            title={t("contents.forward5")}
          >
            ››
          </button>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            title={t("contents.lastPage")}
          >
            »
          </button>
        </div>

        {/* TABLE */}

        <div className="contents-table-wrapper">
          <table className="contents-table">
            <thead>
              <tr>
                <th className="col-title-header">{t("contents.colTitle")}</th>
                <th>{t("contents.colPlatform")}</th>
                <th>{t("contents.colFormat")}</th>
                <th>{t("contents.colRole")}</th>
                <th className="col-topics">{t("contents.colTopics")}</th>
                <th>{t("contents.colStatus")}</th>
                <th className="col-date">{t("contents.colCreated")}</th>
                <th className="col-date">{t("contents.colPublished")}</th>
                <th className="col-date">{t("contents.colArchived")}</th>
                <th></th>
                <th className="col-actions"></th>
              </tr>
            </thead>

            <tbody>
              {loading &&
                skeletonRows.map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    <td colSpan={9}>
                      <div className="skeleton-line"></div>
                    </td>
                  </tr>
                ))}

              {!loading && contents.length === 0 && (
                <tr>
                  <td colSpan={9}>{t("contents.noContentsFound")}</td>
                </tr>
              )}

              {!loading &&
                contents.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleEdit(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="col-title">
                      <div className="content-title">
                        <strong>{item.title}</strong>
                        {item.description && (
                          <span
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              fontSize: "12px",
                              color: "var(--color-text-secondary)",
                              lineHeight: "1.4",
                              maxWidth: "300px",
                            }}
                            title={item.description}
                          >
                            {item.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>{item.platform_name}</td>
                    <td>
                      {t(`formats.${item.format}`, {
                        defaultValue: item.format,
                      })}
                    </td>
                    <td>
                      {item.content_role ? (
                        <span className={`role role--${item.content_role}`}>
                          {t(`contentRoles.${item.content_role}`, {
                            defaultValue: item.content_role,
                          })}
                        </span>
                      ) : (
                        <span className="role role--none">—</span>
                      )}
                    </td>

                    <td className="col-topics">
                      {item.topics && item.topics.length > 0 ? (
                        <ul className="content-topics-list">
                          {item.topics.map((t) => (
                            <li key={t.id}>{t.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="no-topics">—</span>
                      )}
                    </td>

                    <td>
                      <span className={`status ${item.status}`}>
                        {t(`status.${item.status}`, {
                          defaultValue: item.status,
                        })}
                      </span>
                    </td>

                    <td className="col-date">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>

                    <td className="col-date">
                      {item.published_at ? (
                        (() => {
                          const [year, month, day] = item.published_at
                            .split("T")[0]
                            .split("-")
                            .map(Number);
                          return new Date(
                            year,
                            month - 1,
                            day,
                          ).toLocaleDateString();
                        })()
                      ) : (
                        <span className="no-topics">—</span>
                      )}
                    </td>

                    <td className="col-date">
                      {item.archived_at ? (
                        new Date(item.archived_at).toLocaleDateString()
                      ) : (
                        <span className="no-topics">—</span>
                      )}
                    </td>

                    <td>
                      {!item.has_ideas && (
                        <button
                          className="btn-add-idea"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddIdeaContent(item);
                            setAddIdeaTitle(item.title);
                            setAddIdeaDescription(item.description ?? "");
                            setAddIdeaError(null);
                          }}
                          title={t("common.addToIdeas")}
                          type="button"
                        >
                          {t("contents.addIdea")}
                        </button>
                      )}
                    </td>

                    <td className="actions-cell">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                      >
                        {t("contents.edit")}
                      </button>

                      <button
                        type="button"
                        className="btn-link btn-link--danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(item);
                        }}
                      >
                        {t("contents.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="contents-pagination">
          {/* Primera página */}
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(1)}
            title={t("contents.firstPage")}
          >
            {"«"}
          </button>

          {/* Retroceder 5 páginas */}
          <button
            type="button"
            disabled={page <= 5}
            onClick={() => setPage((prev) => Math.max(prev - 5, 1))}
            title={t("contents.back5")}
          >
            {"‹‹"}
          </button>

          {/* Página anterior */}
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            title={t("contents.prevPage")}
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
            <span>
              {t("contents.pageOf")} {totalPages || 1}
            </span>
          </span>

          {/* Página siguiente */}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            title={t("contents.nextPage")}
          >
            {"›"}
          </button>

          {/* Avanzar 5 páginas */}
          <button
            type="button"
            disabled={page > totalPages - 5}
            onClick={() => setPage((prev) => Math.min(prev + 5, totalPages))}
            title={t("contents.forward5")}
          >
            {"››"}
          </button>

          {/* Última página */}
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            title={t("contents.lastPage")}
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
                ? t("contents.contentUpdated")
                : t("contents.contentCreated"),
            );
          }}
          contentToEdit={contentToEdit}
          idea={selectedIdea}
        />

        {isDeleteModalOpen && contentToDelete && (
          <div className="delete-modal-overlay">
            <div className="delete-modal">
              <h3>
                {contentToDelete.has_session
                  ? t("contents.deleteModalTitleWithSession")
                  : t("contents.deleteModalTitle")}
              </h3>

              <p>
                {contentToDelete.has_session ? (
                  t("contents.deleteModalBodyWithSession")
                ) : (
                  <>
                    {t("contents.deleteModalBody")}{" "}
                    <strong>{contentToDelete.title}</strong>
                  </>
                )}
              </p>

              <div className="delete-modal__actions">
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setContentToDelete(null);
                  }}
                >
                  {t("common.cancel")}
                </button>

                <button
                  className="btn-primary btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  type="button"
                >
                  {isDeleting ? t("contents.deleting") : t("contents.delete")}
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
            <span>{t("contents.contentDeleted")}</span>

            <button
              type="button"
              className="toast__undo"
              onClick={handleUndo}
              disabled={isRestoring}
            >
              {isRestoring ? t("contents.restoring") : t("contents.undoDelete")}
            </button>
          </div>
        )}

        {addIdeaContent && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{t("contents.addToLibrary")}</h3>
              <p className="modal__subtitle">
                {t("contents.addToLibrarySubtitle")}
              </p>
              <input
                value={addIdeaTitle}
                onChange={(e) => setAddIdeaTitle(e.target.value)}
                placeholder={t("ideas.ideaTitlePlaceholder")}
                autoFocus
                maxLength={100}
              />
              <textarea
                value={addIdeaDescription}
                onChange={(e) => setAddIdeaDescription(e.target.value)}
                placeholder={t("ideas.descriptionOptional")}
                rows={2}
              />
              {addIdeaError && <p className="modal__error">{addIdeaError}</p>}
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setAddIdeaContent(null);
                    setAddIdeaTitle("");
                    setAddIdeaDescription("");
                    setAddIdeaError(null);
                  }}
                  disabled={addIdeaSaving}
                  type="button"
                >
                  {t("common.cancel")}
                </button>
                <button
                  className="btn-primary"
                  onClick={handleAddToIdeasLibrary}
                  disabled={addIdeaSaving || !addIdeaTitle.trim()}
                  type="button"
                >
                  {addIdeaSaving
                    ? t("contents.savingIdea")
                    : t("contents.saveIdea")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
