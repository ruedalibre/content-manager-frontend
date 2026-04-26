import ActivityHeatmap from "./ActivityHeatmap";

/* =========================
   TYPES
========================= */

type HeatmapData = {
  activity_date: string;
  total_contents: number;
};

type Props = {
  heatmapData: HeatmapData[];
};

/* =========================
   COMPONENT
========================= */

export default function DashboardConsistencySection({
  heatmapData,
}: Props) {
  return (
    <div className="dashboard__consistency">
      <div className="dashboard__consistency-header">
        <h2>Consistency</h2>
        <p>Your publishing activity across the year</p>
      </div>

      <div className="dashboard__card heatmap-card">
        <ActivityHeatmap data={heatmapData} />
      </div>
    </div>
  );
}