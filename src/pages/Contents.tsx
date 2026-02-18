import "./Contents.scss";

export default function Contents() {
  return (
    <div className="contents-page">
      
      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="contents-page__header">
        <h2 className="page__title">Contents</h2>

        <button className="btn-primary">
          + New Content
        </button>
      </div>

      {/* =========================
          FILTERS BAR
      ========================= */}

      <div className="contents-filters">

        <input
          type="text"
          placeholder="Search content..."
          className="contents-filters__search"
        />

        <select className="contents-filters__select">
          <option>All Platforms</option>
          <option>Instagram</option>
          <option>TikTok</option>
          <option>YouTube</option>
        </select>

        <select className="contents-filters__select">
          <option>All Status</option>
          <option>Draft</option>
          <option>Published</option>
          <option>Scheduled</option>
        </select>

      </div>

      {/* =========================
          TABLE
      ========================= */}

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

            {/* Mock rows */}

            {Array.from({ length: 8 }).map(
              (_, i) => (
                <tr key={i}>
                  <td>Content title {i + 1}</td>
                  <td>Instagram</td>
                  <td>Post</td>
                  <td>
                    <span className="status published">
                      Published
                    </span>
                  </td>
                  <td>Yes</td>
                  <td>Feb 2026</td>
                  <td>
                    <button className="btn-link">
                      Edit
                    </button>
                  </td>
                </tr>
              )
            )}

          </tbody>
        </table>

      </div>

      {/* =========================
          PAGINATION
      ========================= */}

      <div className="contents-pagination">

        <button>{"<"}</button>

        <span>Page 1 of 5</span>

        <button>{">"}</button>

      </div>

    </div>
  );
}
