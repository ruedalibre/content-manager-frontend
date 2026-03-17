import ContentsByPlatformChart from "./ContentByPlatformChart";
import ContentGrowthTimelineChart from "./ContentGrowthTimelineChart";
import ContentGrowthCumulativeChart from "./ContentGrowthCumulativeChart";

/* =========================
   TYPES
========================= */

type PlatformData = {
  platform_name: string;
  total_contents: number;
  percentage: number;
};

type GrowthTimelineData = {
  month: string;
  total_contents: number;
};

type CumulativeGrowthData = {
  month: string;
  total_contents: number;
  cumulative_total: number;
};

type Props = {
  platformData: PlatformData[];
  timelineData: GrowthTimelineData[];
  cumulativeData: CumulativeGrowthData[];
};

/* =========================
   COMPONENT
========================= */

export default function DashboardChartsSection({
  platformData,
  timelineData,
  cumulativeData,
}: Props) {
  return (
    <>
      <section className="dashboard__section">
        <h3>Contents by Platform</h3>
        <div className="dashboard__card">
          <ContentsByPlatformChart data={platformData} />
        </div>
      </section>

      <section className="dashboard__section">
        <h3>Content Growth Timeline</h3>
        <div className="dashboard__card">
          <ContentGrowthTimelineChart data={timelineData} />
        </div>
      </section>

      <section className="dashboard__section">
        <h3>Cumulative Growth</h3>
        <div className="dashboard__card">
          <ContentGrowthCumulativeChart data={cumulativeData} />
        </div>
      </section>
    </>
  );
}