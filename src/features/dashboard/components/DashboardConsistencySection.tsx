import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <div className="dashboard__consistency">
      <div className="dashboard__consistency-header">
        <h2>{t("activity.consistency")}</h2>
        <p>{t("activity.publishingActivity")}</p>
      </div>

      <div className="dashboard__card heatmap-card">
        <ActivityHeatmap data={heatmapData} />
      </div>
    </div>
  );
}