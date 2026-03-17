type Props = {
  idea: {
    id: string;
    title: string;
    source: string;
  };
};

export default function IdeaCard({ idea }: Props) {
  return (
    <div className="idea-card">
      <div className="idea-card__header">
        <span className={`badge ${idea.source}`}>
          {idea.source === "manual" ? "Manual" : "Generated"}
        </span>
      </div>

      <h4>{idea.title}</h4>

      <div className="idea-card__actions">
        <button className="btn-secondary">Use idea</button>
      </div>
    </div>
  );
}