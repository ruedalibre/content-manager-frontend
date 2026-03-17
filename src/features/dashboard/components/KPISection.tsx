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
  return (
    <section className="dashboard__kpis">
      <div className="kpi-card">
        <span>Total Contents</span>
        <h3>{data.total_contents}</h3>
      </div>

      <div className="kpi-card">
        <span>Platforms Used</span>
        <h3>{data.platforms_used}</h3>
      </div>

      <div className="kpi-card">
        <span>Reusable</span>
        <h3>{data.reusable_contents ?? 0}</h3>
      </div>

      <div className="kpi-card">
        <span>Growth Rate</span>
        <h3 className={`growth-rate ${growthVisual.className}`}>
          <span className="growth-rate__arrow">{growthVisual.arrow}</span>
          {growthVisual.label}
        </h3>
      </div>
    </section>
  );
}