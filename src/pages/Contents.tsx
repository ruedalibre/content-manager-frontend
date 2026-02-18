import { useEffect, useState } from "react";
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

  const [contents, setContents] =
    useState<ContentItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* =========================
     FETCH DATA
  ========================= */

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
      apikey:
        import.meta.env.VITE_SUPABASE_ANON_KEY,
    };

    fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-contents-history`,
      { headers },
    )
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        setContents(data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(
          "Contents fetch error:",
          err,
        );
        setLoading(false);
      });
  }, []);

  /* =========================
     STATES
  ========================= */

  if (loading) {
    return <p>Loading contents...</p>;
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="contents-page">

      {/* HEADER */}

      <div className="contents-page__header">
        <h2 className="page__title">
          Contents
        </h2>

        <button className="btn-primary">
          + New Content
        </button>
      </div>

      {/* FILTERS (MVP STATIC) */}

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

            {contents.length === 0 && (
              <tr>
                <td colSpan={7}>
                  No contents found
                </td>
              </tr>
            )}

            {contents.map((item) => (
              <tr key={item.id}>

                {/* TITLE */}

                <td>
                  <div className="content-title">
                    <strong>
                      {item.title}
                    </strong>

                    {item.description && (
                      <span>
                        {item.description}
                      </span>
                    )}
                  </div>
                </td>

                {/* PLATFORM */}

                <td>
                  {item.platform_name}
                </td>

                {/* FORMAT */}

                <td>
                  {item.format}
                </td>

                {/* STATUS */}

                <td>
                  <span
                    className={`status ${item.status}`}
                  >
                    {item.status}
                  </span>
                </td>

                {/* REUSABLE */}

                <td>
                  {item.is_reusable
                    ? "Yes"
                    : "No"}
                </td>

                {/* CREATED */}

                <td>
                  {new Date(
                    item.created_at,
                  ).toLocaleDateString()}
                </td>

                {/* ACTIONS */}

                <td>
                  <button className="btn-link">
                    Edit
                  </button>
                </td>

              </tr>
            ))}

          </tbody>
        </table>

      </div>

      {/* PAGINATION (MVP) */}

      <div className="contents-pagination">
        <button>{"<"}</button>
        <span>Page 1</span>
        <button>{">"}</button>
      </div>

    </div>
  );
}
