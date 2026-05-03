import { useState } from "react";
import { type CreativeSession, type Idea, type IdeaTopic } from "../hooks/useIdeas.ts";
import StatusBadge from "./StatusBadge.tsx";
import { downloadBrief } from "../../../utils/downloadBrief";

/* =========================
   CONSTANTS
========================= */

const EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];
const TOOLTIPS = [
  "Completely off — needs a different approach",
  "Not convincing — try again",
  "Could be better — suggest an adjustment",
  "Good — keeping this",
  "Excellent — love it",
];

/* =========================
   TYPES
========================= */

type RecipePanelProps = {
  session: CreativeSession;
  idea: Idea;
  onClose: () => void;
  onApprove: () => void;
  onDiscard: () => void;
  onCreateContent: () => void;
  saveFeedback: (
    sessionId: string,
    feedback: Record<string, number>,
  ) => Promise<void>;
  updateSessionStatus: (
    sessionId: string,
    status: CreativeSession["status"],
  ) => Promise<void>;
  regenerateAspect: (params: {
    session_id: string;
    aspect: "angle" | "hook" | "tone" | "structure";
    rating: number;
    current_value: string;
    previous_alternatives: string[];
    recipe_context: CreativeSession["recipe"];
    idea_title: string;
    topics: string[];
    platform: string;
    format: string;
  }) => Promise<{ alternative: string | string[] }>;
  updateRecipeAspect: (
    sessionId: string,
    recipe: CreativeSession["recipe"],
  ) => Promise<void>;
  ideaTopics: IdeaTopic[];
  platformName: string;
};

/* =========================
   COMPONENT
========================= */

export default function RecipePanel({
  session,
  idea,
  onClose,
  onDiscard,
  onCreateContent,
  saveFeedback,
  updateSessionStatus,
  regenerateAspect,
  updateRecipeAspect,
  ideaTopics,
  platformName,
}: RecipePanelProps) {
  const [feedback, setFeedback] = useState<Record<string, number>>(
    session.feedback ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(session.status === "reviewed");

  // { [aspectKey]: (string | string[])[] } — max 3 per aspect
  const [alternatives, setAlternatives] = useState<Record<string, (string | string[])[]>>({});

  // { [aspectKey]: string } — current visible value (original or chosen alternative)
  const [currentValues, setCurrentValues] = useState<Record<string, string>>({});

  // { [aspectKey]: boolean } — generating state
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});

  const [copied, setCopied] = useState(false);

  /* =========================
     HANDLERS
  ========================= */

  const handleRate = (key: string, value: number) => {
    setFeedback((prev) => ({ ...prev, [key]: value }));
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await saveFeedback(session.id, feedback);
      await updateSessionStatus(session.id, "reviewed");
      // NO llamar onApprove() — no cerrar el modal
      setApproved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async (aspectKey: string) => {
    setRegenerating((prev) => ({ ...prev, [aspectKey]: true }));
    try {
      const currentVal =
        currentValues[aspectKey] ??
        session.recipe[aspectKey as keyof typeof session.recipe];
      const prevAlts = alternatives[aspectKey] ?? [];

      const result = await regenerateAspect({
        session_id: session.id,
        aspect: aspectKey as "angle" | "hook" | "tone" | "structure",
        rating: feedback[aspectKey] ?? 1,
        current_value:
          typeof currentVal === "string"
            ? currentVal
            : JSON.stringify(currentVal),
        previous_alternatives: prevAlts.map((a) =>
          typeof a === "string" ? a : JSON.stringify(a),
        ),
        recipe_context: session.recipe,
        idea_title: idea.title,
        topics: ideaTopics.map((t) => t.name),
        platform: platformName,
        format: session.format,
      });

      let alternativeValue: string | string[] = result.alternative as string | string[];

      if (aspectKey === 'structure' &&
          typeof result.alternative === 'string') {
        try {
          const clean = (result.alternative as string)
            .replace(/```json|```/g, '').trim();
          alternativeValue = JSON.parse(clean);
        } catch {
          // Si falla el parse, dividir por saltos de línea
          alternativeValue = (result.alternative as string)
            .split('\n')
            .map(s => s.replace(/^[-•*\d.]\s*/, '').trim())
            .filter(s => s.length > 0);
        }
      }

      setAlternatives((prev) => ({
        ...prev,
        [aspectKey]: [
          ...(prev[aspectKey] ?? []),
          alternativeValue,
        ],
      }));
    } catch (err) {
      console.error("Regenerate error:", err);
    } finally {
      setRegenerating((prev) => ({ ...prev, [aspectKey]: false }));
    }
  };

  const handleChooseAlternative = async (
    aspectKey: string,
    altIndex: number,
  ) => {
    const chosen = alternatives[aspectKey][altIndex];

    // Update visible value
    setCurrentValues((prev) => ({ ...prev, [aspectKey]: chosen as string }));

    // Clear alternatives
    setAlternatives((prev) => ({ ...prev, [aspectKey]: [] }));

    // Persist to DB
    const updatedRecipe = {
      ...session.recipe,
      [aspectKey]: chosen,
    };
    await updateRecipeAspect(session.id, updatedRecipe);
  };

  const handleCopyBrief = async () => {
    if (!session?.recipe) return;

    const text = [
      `CONTENT BRIEF`,
      `Idea: ${idea.title}`,
      idea.description ? `Context: ${idea.description}` : '',
      `Format: ${session.format}`,
      session.content_role ? `Role: ${session.content_role}` : '',
      ``,
      `ANGLE`,
      session.recipe.angle,
      ``,
      `HOOK`,
      session.recipe.hook,
      ``,
      `TONE`,
      session.recipe.tone,
      ``,
      `STRUCTURE`,
      ...session.recipe.structure.map((s, i) => `${i + 1}. ${s}`),
      session.recipe.strategic_note
        ? `\nSTRATEGIC NOTE\n${session.recipe.strategic_note}`
        : '',
      ``,
      `---`,
      `Generated by Content Intelligence App`,
      `AI-assisted creative guide. AI-generated outputs may not be eligible for copyright protection.`,
    ].filter(line => line !== '').join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Copy failed')
    }
  }

  /* =========================
     ASPECT RENDERER
  ========================= */

  const renderAspect = (aspectKey: string, label: string, isStructure = false) => {
    const rawValue = session.recipe[aspectKey as keyof typeof session.recipe];
    const displayValue = currentValues[aspectKey] ?? rawValue;
    const rating = feedback[aspectKey] ?? 0;
    const aspectAlts = alternatives[aspectKey] ?? [];

    return (
      <div key={aspectKey} className="recipe-panel__aspect">
        <div className="recipe-panel__aspect-header">
          <span className="recipe-panel__aspect-label">{label}</span>
          <div className="recipe-panel__rating">
            {EMOJIS.map((emoji, i) => (
              <button
                key={i}
                type="button"
                className={`rating-emoji ${rating === i + 1 ? "rating-emoji--active" : ""}`}
                onClick={() => handleRate(aspectKey, i + 1)}
                title={TOOLTIPS[i]}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* DISPLAY VALUE */}
        {isStructure ? (
          <ol className="recipe-panel__structure">
            {(Array.isArray(displayValue) ? displayValue : [displayValue]).map(
              (step, i) => (
                <li key={i}>{step as string}</li>
              ),
            )}
          </ol>
        ) : (
          <p className="recipe-panel__aspect-text">{displayValue as string}</p>
        )}

        {/* TRY AGAIN */}
        {rating > 0 && rating <= 3 && (
          <div className="recipe-panel__regenerate">
            {aspectAlts.length < 3 ? (
              <button
                type="button"
                className="btn-try-again"
                disabled={regenerating[aspectKey]}
                onClick={() => handleRegenerate(aspectKey)}
              >
                {regenerating[aspectKey] ? "Generating..." : "↺ Try again"}
              </button>
            ) : (
              <span className="recipe-panel__no-more">
                No more suggestions for this aspect
              </span>
            )}
          </div>
        )}

        {/* ALTERNATIVES */}
        {aspectAlts.map((alt, altIndex) => (
          <div key={altIndex} className="recipe-panel__alternative">
            {Array.isArray(alt) ? (
              <ol className="recipe-panel__alternative-structure">
                {(alt as string[]).map((step, si) => (
                  <li key={si}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="recipe-panel__alternative-text">{alt}</p>
            )}
            <button
              type="button"
              className="btn-choose-alt"
              onClick={() => handleChooseAlternative(aspectKey, altIndex)}
            >
              Use this
            </button>
          </div>
        ))}
      </div>
    );
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="recipe-panel-overlay" onClick={onClose}>
      <div className="recipe-panel" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="recipe-panel__header">
          <div>
            <h3 className="recipe-panel__title">{idea.title}</h3>
            <div className="recipe-panel__meta">
              <StatusBadge status={approved ? "reviewed" : session.status} />
              <span className="recipe-panel__date">
                {new Date(session.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="recipe-panel__body">

          {/* LEFT — COMBINATION */}
          <div className="recipe-panel__combination">
            <h4 className="recipe-panel__section-title">Combination</h4>
            <div className="recipe-panel__combo-item">
              <span className="recipe-panel__combo-label">💡 Idea</span>
              <span className="recipe-panel__combo-value">{idea.title}</span>
            </div>
            {idea.topics && idea.topics.length > 0 && (
              <div className="recipe-panel__combo-item">
                <span className="recipe-panel__combo-label">🏷️ Topics</span>
                <div className="recipe-panel__combo-chips">
                  {idea.topics.map((t) => (
                    <span key={t.id} className="topic-chip topic-chip--small">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="recipe-panel__combo-item">
              <span className="recipe-panel__combo-label">📱 Format</span>
              <span className="recipe-panel__combo-value">{session.format}</span>
            </div>
            {session.content_role && (
              <div className="recipe-panel__combo-item">
                <span className="recipe-panel__combo-label">🎭 Role</span>
                <span className="recipe-panel__combo-value">
                  {session.content_role}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT — RECIPE */}
          <div className="recipe-panel__recipe">
            <h4 className="recipe-panel__section-title">Brief</h4>

            {renderAspect("angle", "Angle")}
            {renderAspect("hook", "Hook")}
            {renderAspect("tone", "Tone")}
            {renderAspect("structure", "Structure", true)}

            {session.recipe.strategic_note && (
              <div className="recipe-panel__strategic-note">
                <span className="recipe-panel__aspect-label">
                  Strategic note
                </span>
                <p>{session.recipe.strategic_note}</p>
              </div>
            )}

            <p className="recipe-panel__disclaimer">
              AI-assisted creative guide. AI-generated outputs may not
              be eligible for copyright protection. Content Intelligence
              App does not claim IP rights over this output.
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="recipe-panel__actions">
          <button
            className="btn-secondary"
            onClick={() => downloadBrief(session, {
              title: idea.title,
              description: idea.description,
              topics: ideaTopics
            })}
            type="button"
          >
            ↓ Download brief
          </button>
          <button
            className="btn-secondary"
            onClick={handleCopyBrief}
            type="button"
          >
            {copied ? "✓ Copied" : "⎘ Copy brief"}
          </button>
          <button
            className="btn-secondary"
            onClick={onDiscard}
            type="button"
          >
            Discard
          </button>
          <button
            className="btn-primary"
            onClick={onCreateContent}
            type="button"
          >
            Create content →
          </button>
          <button
            className={`btn-primary ${approved ? "btn-primary--approved" : ""}`}
            onClick={handleApprove}
            disabled={saving || approved}
            type="button"
          >
            {saving ? "Saving..." : approved ? "✓ Approved" : "Approve"}
          </button>
        </div>

      </div>
    </div>
  );
}
