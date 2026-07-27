import { useTranslation } from "react-i18next";

type DashboardData = {
  total_contents: number;
  platforms_used: number;
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
        <h3
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-40)",
            fontWeight: 500,
          }}
        >
          {data.total_contents}
        </h3>
      </div>

      <div className="kpi-card">
        <span>{t("activity.platformsUsed")}</span>
        <h3
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-40)",
            fontWeight: 500,
          }}
        >
          {data.platforms_used}
        </h3>
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
