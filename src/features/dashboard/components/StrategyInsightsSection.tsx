import "./StrategyInsightsSection.scss";

/* =========================
   TYPES
========================= */

type StrategyInsight = {
  type: string;
  title: string;
  message: string;
  confidence?: number;
};

type Props = {
  insights: StrategyInsight[];
};

/* =========================
   HELPERS
========================= */

const getInsightIcon = (type: string) => {
  switch (type) {
    case "content_engine":
      return "🔥";

    case "content_engines":
      return "🚀";

    case "unused_ideas":
      return "💡";

    default:
      return "✨";
  }
};

/* =========================
   COMPONENT
========================= */

export default function StrategyInsightsSection({ insights }: Props) {
  if (!insights || insights.length === 0) return null;

  /* =========================
     SORT BY CONFIDENCE
  ========================= */

  const sortedInsights = [...insights].sort(
    (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0),
  );

  /* =========================
     RENDER
  ========================= */

  return (
    <section className="strategy-insights">
      <div className="strategy-insights__header">
        <h3>Strategy Insights</h3>
        <p>Patterns detected in your content strategy</p>
      </div>

      <div className="strategy-insights__grid">
        {sortedInsights.map((insight, index) => (
          <div key={index} className="strategy-insight-card">
            <div className="strategy-insight-card__icon">
              {getInsightIcon(insight.type)}
            </div>

            <div className="strategy-insight-card__content">
              <h4>{insight.title}</h4>
              <p>{insight.message}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
