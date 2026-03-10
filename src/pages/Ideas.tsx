import { useState } from "react";
import { Youtube, Instagram, Video } from "lucide-react";
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
   MOCK DATA
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
   HELPERS
========================= */

const getMostFrequent = (arr: string[]) => {
  if (arr.length === 0) return null;

  const counts: Record<string, number> = {};

  arr.forEach((item) => {
    counts[item] = (counts[item] || 0) + 1;
  });

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "youtube":
      return <Youtube size={14} />;
    case "instagram":
      return <Instagram size={14} />;
    case "tiktok":
      return <Video size={14} />;
    default:
      return null;
  }
};

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
    idea.note.toLowerCase().includes(search.toLowerCase()),
  );

  /* =========================
     CONTENT DNA
  ========================= */

  const formats = ideas.map((i) => i.format);
  const platforms = ideas.map((i) => i.platform);

  const preferredFormat = getMostFrequent(formats);
  const preferredPlatform = getMostFrequent(platforms);

  const dnaInsight = `You frequently create ${preferredFormat?.toLowerCase()} content on ${preferredPlatform}.`;

  const insight =
    preferredFormat === "Video"
      ? "Most of your reusable ideas come from video content."
      : `You often generate reusable ideas from ${preferredFormat?.toLowerCase()} content.`;

  // const valueStatement = `Your content ideas mostly originate from ${preferredFormat?.toLowerCase()} content.`;

  /* =========================
     IDEA HIGHLIGHT
  ========================= */

  const highlightIdea = ideas[0];

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="ideas-page">
      {/* HEADER */}

      {/* <div className="ideas-value">{valueStatement}</div> */}

      <div className="ideas-header">
        <h2>Discover reusable ideas and creative patterns from your content history</h2>
      </div>

      {/* CONTENT DNA */}

      <div className="ideas-dna-banner">
        <strong>Your Content DNA</strong>
        <p>{dnaInsight}</p>
      </div>

      <div className="ideas-insight">
        <div className="ideas-insight__title">
          <span className="insight-dot"></span>
          Insight
        </div>
        <p>{insight}</p>
      </div>

      {/* IDEA HIGHLIGHT */}

      {highlightIdea && (
        <div className="idea-highlight">
          <div className="idea-highlight__label">Idea Highlight</div>

          <div className="idea-highlight__note">{highlightIdea.note}</div>

          <div className="idea-highlight__meta">
            {highlightIdea.platform} • {highlightIdea.format} •{" "}
            {new Date(highlightIdea.created_at).toLocaleDateString()}
          </div>

          <p className="idea-highlight__explain">
            This idea appears across your content patterns and could be reused
            in future pieces.
          </p>
        </div>
      )}

      {/* IDEAS LIBRARY */}

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

          {filteredIdeas.map((idea) => {
            const relatedIdeas = ideas
              .filter((i) => i.id !== idea.id)
              .slice(0, 2);

            return (
              <div key={idea.id} className="idea-card">
                <div className="idea-card__note">{idea.note}</div>

                <div className="idea-card__meta">
                  <div className="idea-badges">
                    <span
                      className={`badge badge--platform ${idea.platform.toLowerCase()}`}
                    >
                      {getPlatformIcon(idea.platform)}
                      {idea.platform}
                    </span>

                    <span className="badge badge--format">{idea.format}</span>
                  </div>

                  <span className="idea-date">
                    {new Date(idea.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* RELATED IDEAS */}

                {relatedIdeas.length > 0 && (
                  <div className="idea-card__related">
                    <span className="related-label">Related ideas</span>

                    <ul>
                      {relatedIdeas.map((r) => (
                        <li key={r.id}>{r.note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
