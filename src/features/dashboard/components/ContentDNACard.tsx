/* =========================
   TYPES
========================= */

type ContentDNA = {
  primary_topic: string | null;
  primary_format: string | null;
  primary_role: string | null;
  top_ideas?: string[];
  topic_distribution?: {
    topic: string;
    percentage: number;
  }[];
};

type Props = {
  dna: ContentDNA | null;
};

/* =========================
   COMPONENT
========================= */

export default function ContentDNACard({ dna }: Props) {
  if (!dna) return null;

  return (
    <div className="content-dna-card">
      <div className="content-dna-card__header">
        <h3>Your Content DNA</h3>
        <p>Your creative identity based on your content</p>
      </div>

      <div className="content-dna-card__grid">
        <div className="dna-item">
          <span className="dna-label">Primary Topic</span>
          <strong>{dna.primary_topic ?? "—"}</strong>
        </div>

        <div className="dna-item">
          <span className="dna-label">Primary Format</span>
          <strong>{dna.primary_format ?? "—"}</strong>
        </div>

        <div className="dna-item">
          <span className="dna-label">Content Role</span>
          <strong>{dna.primary_role ?? "—"}</strong>
        </div>
      </div>

      {/* TOP IDEAS */}

      {dna.top_ideas && dna.top_ideas.length > 0 && (
        <div className="content-dna-card__section">
          <span className="dna-label">Top Ideas</span>

          <div className="dna-tags">
            {dna.top_ideas.map((idea, index) => (
              <span key={index} className="dna-tag">
                {idea}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* TOPIC DISTRIBUTION */}

      {dna.topic_distribution && dna.topic_distribution.length > 0 && (
        <div className="content-dna-card__section">
          <span className="dna-label">Topic Distribution</span>

          <div className="dna-bars">
            {dna.topic_distribution.map((t, index) => (
              <div key={index} className="dna-bar">
                <span>{t.topic}</span>
                <div className="dna-bar__track">
                  <div
                    className="dna-bar__fill"
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
                <span>{t.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}