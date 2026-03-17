import "./ContentDNACard.scss";
import { useState } from "react";
import { generateIdeasFromDNA } from "../../../utils/generateIdeasFromDNA.ts";

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
    count?: number;
    total?: number;
  }[];
};

type Props = {
  dna: ContentDNA | null;
};

/* =========================
   COMPONENT
========================= */

export default function ContentDNACard({ dna }: Props) {
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);

  const handleGenerateIdeas = () => {
    if (!dna) return;

    const ideas = generateIdeasFromDNA(dna);
    setGeneratedIdeas(ideas);
  };

  if (!dna) return null;

  const getStrategyMessage = () => {
    if (!dna) return null;

    const { primary_topic, primary_format, primary_role } = dna;

    if (primary_topic && primary_format && primary_role) {
      return `You perform best when creating ${primary_role} content about ${primary_topic} using ${primary_format} format.`;
    }

    if (primary_topic && primary_format) {
      return `You perform best when creating ${primary_topic} content using ${primary_format} format.`;
    }

    if (primary_topic) {
      return `Your strongest topic is ${primary_topic}. Focus on expanding this area.`;
    }

    return "Start creating more content to unlock your Content DNA.";
  };

  return (
    <div className="content-dna-card">
      <div className="content-dna-card__header">
        <h3>Your Content DNA</h3>
        <p>Your creative identity based on your content</p>
      </div>

      {dna && (
        <div className="content-dna-card__insight">
          <p>{getStrategyMessage()}</p>

          <div className="content-dna-card__actions">
            <button className="btn-primary" onClick={handleGenerateIdeas}>
              Generate idea based on this
            </button>
          </div>
        </div>
      )}

      {generatedIdeas.length > 0 && (
        <div className="content-dna-card__ideas">
          <span className="dna-label">Generated Ideas</span>

          <ul>
            {generatedIdeas.map((idea, index) => (
              <li key={index}>{idea}</li>
            ))}
          </ul>
        </div>
      )}

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
            {dna.topic_distribution.map((t, index) => {
              const percentage =
                t.percentage ??
                Math.round(
                  ((t.count || t.total || 0) /
                    (dna.topic_distribution?.reduce(
                      (acc, item) => acc + (item.count || item.total || 0),
                      0,
                    ) || 1)) *
                    100,
                );

              return (
                <div key={index} className="dna-bar">
                  <span>{t.topic}</span>

                  <div className="dna-bar__track">
                    <div
                      className="dna-bar__fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span>{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
