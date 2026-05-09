import { useTranslation } from "react-i18next";

type DashboardData = {
  total_contents: number;
  platforms_used: number;
  reusable_contents?: number;
};

type Props = {
  data: DashboardData;
  growthVisual: {
    label: string;
    className: string;
    arrow: string;
  };
};

export default function KPISection({ data, growthVisual }: Props) {
  const { t } = useTranslation();
  return (
    <section className="dashboard__kpis">
      <div className="kpi-card">
        <span>{t("activity.totalContents")}</span>
        <h3>{data.total_contents}</h3>
      </div>

      <div className="kpi-card">
        <span>{t("activity.platformsUsed")}</span>
        <h3>{data.platforms_used}</h3>
      </div>

      <div className="kpi-card">
        <span>{t("activity.reusable")}</span>
        <h3>{data.reusable_contents ?? 0}</h3>
      </div>

      <div className="kpi-card">
        <span>{t("activity.growthRate")}</span>
        <h3 className={`growth-rate ${growthVisual.className}`}>
          <span className="growth-rate__arrow">{growthVisual.arrow}</span>
          {growthVisual.label}
        </h3>
      </div>
    </section>
  );
}
