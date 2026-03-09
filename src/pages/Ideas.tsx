import { useState } from "react";
import "./Ideas.scss";

/* =========================
   TYPES
========================= */

type IdeaItem = {
  id: string;
  note: string;
  platform: string;
  format: string;
  created_at: string;
};

/* =========================
   MOCK DATA (MVP)
   Luego vendrá del backend
========================= */

const mockIdeas: IdeaItem[] = [
  {
    id: "1",
    note: "Hook about productivity burnout",
    platform: "YouTube",
    format: "Video",
    created_at: "2026-03-02",
  },
  {
    id: "2",
    note: "Story about first freelance client",
    platform: "Instagram",
    format: "Post",
    created_at: "2026-03-04",
  },
  {
    id: "3",
    note: "Insight about batching content",
    platform: "TikTok",
    format: "Video",
    created_at: "2026-03-06",
  },
];

/* =========================
   COMPONENT
========================= */

export default function Ideas() {
  const [ideas] = useState<IdeaItem[]>(mockIdeas);
  const [search, setSearch] = useState("");

  /* =========================
     FILTER
  ========================= */

  const filteredIdeas = ideas.filter((idea) =>
    idea.note.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================
     CONTENT DNA (MVP)
  ========================= */

  const formats = [...new Set(ideas.map((i) => i.format))];
  const platforms = [...new Set(ideas.map((i) => i.platform))];

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="ideas-page">
      {/* HEADER */}

      <div className="ideas-header">
        <p>Discover reusable ideas and patterns from your content</p>
      </div>

      {/* CONTENT DNA */}

      <div className="ideas-dna">

        <div className="dna-card">
          <h4>Preferred Formats</h4>
          <div className="dna-values">
            {formats.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
        </div>

        <div className="dna-card">
          <h4>Top Platforms</h4>
          <div className="dna-values">
            {platforms.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
        </div>

        <div className="dna-card">
          <h4>Reusable Ideas</h4>
          <div className="dna-values">
            <span>{ideas.length} ideas</span>
          </div>
        </div>

      </div>

      {/* REUSABLE IDEAS */}

      <div className="ideas-library">

        <div className="ideas-library__header">

          <h3>Reusable Ideas</h3>

          <input
            type="text"
            placeholder="Search ideas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        {/* LIST */}

        <div className="ideas-list">

          {filteredIdeas.length === 0 && (
            <p className="ideas-empty">No ideas found</p>
          )}

          {filteredIdeas.map((idea) => (
            <div key={idea.id} className="idea-card">

              <div className="idea-card__note">
                {idea.note}
              </div>

              <div className="idea-card__meta">
                {idea.platform} • {idea.format} •{" "}
                {new Date(idea.created_at).toLocaleDateString()}
              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}