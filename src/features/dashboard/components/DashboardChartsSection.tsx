import { useTranslation } from "react-i18next";
import ContentsByPlatformChart from "./ContentByPlatformChart";
import ContentGrowthTimelineChart from "./ContentGrowthTimelineChart";
import ContentGrowthCumulativeChart from "./ContentGrowthCumulativeChart";

import {
  type PlatformData,
  type TimelineData,
  type CumulativeGrowthData,
} from "../types/dashboard.types";

type Props = {
  platformData: PlatformData[];
  timelineData: TimelineData[];
  cumulativeData: CumulativeGrowthData[];
};

export default function DashboardChartsSection({
  platformData,
  timelineData,
  cumulativeData,
}: Props) {
  const { t } = useTranslation();
  return (
    <>
      <section className="dashboard__section">
        <h3>{t("activity.contentsByPlatform")}</h3>
        <div className="dashboard__card">
          <ContentsByPlatformChart data={platformData} />
        </div>
      </section>

      <section className="dashboard__section">
        <h3>{t("activity.contentGrowthTimeline")}</h3>
        <div className="dashboard__card">
          <ContentGrowthTimelineChart data={timelineData} />
        </div>
      </section>

      <section className="dashboard__section">
        <h3>{t("activity.cumulativeGrowth")}</h3>
        <div className="dashboard__card">
          <ContentGrowthCumulativeChart data={cumulativeData} />
        </div>
      </section>
    </>
  );
}
