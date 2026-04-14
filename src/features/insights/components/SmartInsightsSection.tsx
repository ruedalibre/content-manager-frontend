import InsightsPanel from "./InsightsPanel";
import { type AnalyticsInsight } from "../types/insights.types";

type Props = {
  insights: AnalyticsInsight[];
};

export default function SmartInsightsSection({ insights }: Props) {
  if (!insights || insights.length === 0) return null;

  return (
    <section className="insights-section">
      <h3>Smart Insights</h3>

      <InsightsPanel data={insights} />
    </section>
  );
}
