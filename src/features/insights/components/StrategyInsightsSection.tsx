import { Flame, Rocket, Lightbulb, Sparkles } from "lucide-react";

import { type StrategyInsight } from "../types/insights.types";

import "./StrategyInsightsSection.scss";

/* =========================
   TYPES
========================= */

type Props = {
  insights: StrategyInsight[];
};

/* =========================
   HELPERS
========================= */

const getInsightIcon = (type: string) => {
  switch (type) {
    case "content_engine":
      return <Flame size={18} />;

    case "content_engines":
      return <Rocket size={18} />;

    case "unused_ideas":
      return <Lightbulb size={18} />;

    default:
      return <Sparkles size={18} />;
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
            <div
              className="strategy-insight-card__icon"
              data-type={insight.type}
            >
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
