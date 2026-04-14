import "./InsightsPanel.scss";
import { type AnalyticsInsight } from "../types/insights.types.ts";

type Props = {
  data: AnalyticsInsight[];
};

export default function InsightsPanel({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="insights-panel">
      {data.map((item, index) => (
        <div key={index} className="insight-card">
          <h4>{item.title}</h4>

          <p className="insight-card__insight">{item.insight}</p>

          <p className="insight-card__strategy">{item.strategy}</p>

          <p className="insight-card__action">{item.action}</p>
        </div>
      ))}
    </div>
  );
}
