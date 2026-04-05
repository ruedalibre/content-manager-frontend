type Props = {
  idea: {
    id: string;
    title: string;
    source: "manual" | "generated";
  };
};

export default function IdeaCard({ idea }: Props) {
  const isGenerated = idea.source === "generated";

  return (
    <div className="idea-card">
      <div className="idea-card__header">
        <span
          className={`badge ${
            isGenerated ? "badge--generated" : "badge--manual"
          }`}
        >
          {isGenerated ? "Generated" : "Manual"}
        </span>
      </div>

      <h4>{idea.title}</h4>

      <div className="idea-card__actions">
        <button className="btn-secondary">Use idea</button>
      </div>
    </div>
  );
}
