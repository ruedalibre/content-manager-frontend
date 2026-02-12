import "./Dashboard.scss"

export default function Dashboard() {
  return (
    <div className="dashboard">

      <h2 className="page__title">
        Dashboard
      </h2>

      {/* KPI GRID */}

      <section className="dashboard__kpis">

        <div className="kpi-card">
          <span>Total Contents</span>
          <h3>0</h3>
        </div>

        <div className="kpi-card">
          <span>Platforms Used</span>
          <h3>0</h3>
        </div>

        <div className="kpi-card">
          <span>Reusable</span>
          <h3>0</h3>
        </div>

        <div className="kpi-card">
          <span>Last Activity</span>
          <h3>—</h3>
        </div>

      </section>

    </div>
  )
}
