import "./ContentDNACard.scss";
import { useEffect, useState } from "react";
import { generateIdeasFromDNA } from "../../../utils/generateIdeasFromDNA.ts";
import { supabase } from "../../../supabaseClient.ts";

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
  const [showIdeas, setShowIdeas] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState<string[]>([]);
  const [existingIdeas, setExistingIdeas] = useState<string[]>([]);

  /* =========================
     LOAD EXISTING IDEAS
  ========================= */

  useEffect(() => {
    const loadIdeas = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: userRecord, error: userError } = await supabase
          .from("users")
          .select("tenant_id")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;
        if (!userRecord) return;

        const { data: ideas } = await supabase
          .from("creative_units")
          .select("title")
          .eq("tenant_id", userRecord.tenant_id);

        if (ideas) {
          setExistingIdeas(ideas.map((i: { title: string }) => i.title));
        }
      } catch (err) {
        console.error("Error loading ideas:", err);
      }
    };

    loadIdeas();
  }, []);

  /* =========================
     GENERATE IDEAS
  ========================= */

  const handleGenerateIdeas = () => {
    if (!dna) return;

    const ideas = generateIdeasFromDNA(dna);
    setGeneratedIdeas(ideas);
    setShowIdeas(true);
  };

  /* =========================
     SAVE IDEA
  ========================= */

  const handleSaveIdea = async (idea: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;
      if (!userRecord) return;

      const { error } = await supabase.from("creative_units").insert({
        title: idea,
        description: "Generated from Content DNA",
        tenant_id: userRecord.tenant_id,
        source: "content_dna",
      });

      if (error) {
        // evitar duplicados silenciosamente
        if (error.code === "23505") {
          setSavedIdeas((prev) => [...prev, idea]);
          return;
        }
        throw error;
      }

      // actualizar estados
      setSavedIdeas((prev) => [...prev, idea]);
      setExistingIdeas((prev) => [...prev, idea]);
    } catch (err) {
      console.error("Error saving idea:", err);
    }
  };

  if (!dna) return null;

  /* =========================
     STRATEGY MESSAGE
  ========================= */

  const getStrategyMessage = () => {
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

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="content-dna-card">
      <div className="content-dna-card__header">
        <h3>Your Content DNA</h3>
        <p>Your creative identity based on your content</p>
      </div>

      <div className="content-dna-card__insight">
        <p>{getStrategyMessage()}</p>

        <div className="content-dna-card__actions">
          <button
            className="btn-primary"
            onClick={() => {
              if (showIdeas) {
                setShowIdeas(false);
              } else {
                handleGenerateIdeas();
              }
            }}
          >
            {showIdeas ? "Hide ideas" : "Generate ideas"}
          </button>
        </div>
      </div>

      {showIdeas && generatedIdeas.length > 0 && (
        <div className="content-dna-card__ideas">
          <div className="ideas-header">
            <span className="dna-label">Generated Ideas</span>
          </div>

          <ul>
            {generatedIdeas.map((idea, index) => {
              const isSaved =
                savedIdeas.includes(idea) || existingIdeas.includes(idea);

              return (
                <li key={index} className="idea-item">
                  <span>{idea}</span>

                  <button
                    className="btn-save"
                    onClick={() => handleSaveIdea(idea)}
                    disabled={isSaved}
                  >
                    {isSaved ? "Saved ✓" : "Save"}
                  </button>
                </li>
              );
            })}
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

      {dna.topic_distribution && dna.topic_distribution.length > 0 && (
        <div className="content-dna-card__section">
          <span className="dna-label">Topic Distribution</span>

          <div className="dna-bars">
            {dna.topic_distribution.map((t, index) => {
              const total =
                dna.topic_distribution?.reduce(
                  (acc, item) => acc + (item.count || item.total || 0),
                  0
                ) || 1;

              const percentage =
                t.percentage ??
                Math.round(((t.count || t.total || 0) / total) * 100);

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