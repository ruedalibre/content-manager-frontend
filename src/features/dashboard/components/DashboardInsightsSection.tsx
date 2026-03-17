import InsightsPanel from "./InsightsPanel";

/* =========================
   TYPES
========================= */

type Insight = {
  title: string;
  message: string;
};

type Props = {
  insights: Insight[];
};

/* =========================
   COMPONENT
========================= */

export default function DashboardInsightsSection({ insights }: Props) {
  return (
    <section className="dashboard__section">
      <h3>Smart Insights</h3>
      <InsightsPanel data={insights} />
    </section>
  );
}