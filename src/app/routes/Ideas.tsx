import { useState } from "react";
import { useIdeas } from "../../features/ideas/hooks/useIdeas";
import CreateContentModal from "../../features/contents/modals/CreateContentModal.tsx";
import "./Ideas.scss";

type Idea = {
  id: string;
  title: string;
  source: string;
  created_at: string;
  description?: string | null;
};

/* =========================
   COMPONENT
========================= */

export default function Ideas() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "manual" | "generated">("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  const { ideas, loading } = useIdeas(filter);

  /* =========================
     FILTER (search)
  ========================= */

  const filteredIdeas = ideas.filter((idea) =>
    idea.title.toLowerCase().includes(search.toLowerCase()),
  );

  /* =========================
     IDEA HIGHLIGHT
  ========================= */

  const highlightIdea = filteredIdeas.length > 0 ? filteredIdeas[0] : null;

  /* =========================
     LOADING
  ========================= */

  if (loading) return <p>Loading ideas...</p>;

  /* =========================
     USE IDEA
  ========================= */

  const handleUseIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setShowCreateModal(true);
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="ideas-page">
      {/* HEADER */}

      <div className="ideas-header">
        <h2>
          Discover reusable ideas and creative patterns from your content
          history
        </h2>
      </div>

      {/* FILTERS */}

      <div className="ideas-filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>

        <button
          className={filter === "manual" ? "active" : ""}
          onClick={() => setFilter("manual")}
        >
          Manual
        </button>

        <button
          className={filter === "generated" ? "active" : ""}
          onClick={() => setFilter("generated")}
        >
          Generated
        </button>
      </div>

      {/* IDEA HIGHLIGHT */}

      {highlightIdea && (
        <div className="idea-highlight">
          <div className="idea-highlight__label">Top Idea</div>

          <div className="idea-highlight__note">{highlightIdea.title}</div>

          <div className="idea-highlight__meta">
            {highlightIdea.source === "manual" ? "Manual" : "Generated"} •{" "}
            {new Date(highlightIdea.created_at).toLocaleDateString()}
          </div>

          <p className="idea-highlight__explain">
            This idea is part of your creative system and can be reused across
            multiple pieces of content.
          </p>

          {/* NEW ACTION */}

          <div className="idea-highlight__actions">
            <button
              className="btn-primary"
              onClick={() => handleUseIdea(highlightIdea)}
            >
              Use idea
            </button>
          </div>
        </div>
      )}

      {/* IDEAS LIBRARY */}

      <div className="ideas-library">
        <div className="ideas-library__header">
          <h3>Ideas Library</h3>

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

          {filteredIdeas.map((idea) => {
            const isGenerated = idea.source === "dna_generated";

            return (
              <div key={idea.id} className="idea-card">
                <div className="idea-card__note">{idea.title}</div>

                <div className="idea-card__meta">
                  <div className="idea-badges">
                    <span
                      className={`badge ${
                        isGenerated ? "badge--generated" : "badge--manual"
                      }`}
                    >
                      {isGenerated ? "Generated" : "Manual"}
                    </span>
                  </div>

                  <span className="idea-date">
                    {new Date(idea.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="idea-card__actions">
                  <button
                    className="btn-secondary"
                    onClick={() => handleUseIdea(idea)}
                  >
                    Use idea
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE CONTENT MODAL */}

      <CreateContentModal
        isOpen={showCreateModal}
        idea={selectedIdea}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedIdea(null);
        }}
        onCreated={() => {}}
      />
    </div>
  );
}
