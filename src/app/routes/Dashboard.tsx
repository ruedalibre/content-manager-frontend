import { useEffect, useState } from "react";
import { useDashboardData } from "../../features/dashboard/hooks/useDashboardData.ts";
import KPISection from "../../features/dashboard/components/KPISection.tsx";
import DashboardChartsSection from "../../features/dashboard/components/DashboardChartsSection";
import DashboardInsightsSection from "../../features/dashboard/components/DashboardInsightsSection";
import { getGrowthVisual } from "../../utils/growthRate.ts";
import ActivityHeatmap from "../../features/dashboard/components/ActivityHeatmap.tsx";
import { useOutletContext, useNavigate } from "react-router-dom";
import "./Dashboard.scss";

/* =========================
   TYPES
========================= */

type OutletContext = {
  setTopbarContext: (value: string | null) => void;
};

/* =========================
   COMPONENT
========================= */

export default function Dashboard() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const {
    data,
    platformData,
    timelineData,
    cumulativeData,
    growthRateData, // ✅ agregado
    heatmapData,
    insights,
    loading,
  } = useDashboardData(period);

  const growthVisual = getGrowthVisual(growthRateData); 

  const { setTopbarContext } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  /* =========================
     MICRO CONTEXT
  ========================= */

  useEffect(() => {
    if (loading) {
      setTopbarContext("Loading...");
      return;
    }

    if (data) {
      const labels = {
        "7d": "Last 7 days",
        "30d": "Last 30 days",
        "90d": "Last 90 days",
      };

      setTopbarContext(
        `${data.total_contents} active contents · ${labels[period]}`
      );
    }

    return () => setTopbarContext(null);
  }, [loading, data, period, setTopbarContext]);

  /* =========================
     LOADING / EMPTY
  ========================= */

  if (loading) return <p>Loading dashboard...</p>;
  if (!data) return <p>No data available</p>;

  /* =========================
     EMPTY STATE
  ========================= */

  if (data.total_contents === 0) {
    return (
      <div className="dashboard-empty">
        <span className="dashboard-empty__badge">No data yet</span>

        <div className="dashboard-empty__icon">📊</div>

        <h2>Your analytics will appear here</h2>

        <p>
          Start by registering your first content to begin tracking your
          production and unlock insights about your platforms and formats.
        </p>

        <ul className="dashboard-empty__benefits">
          <li>Track your content production</li>
          <li>Identify your top platforms</li>
          <li>Discover reusable opportunities</li>
          <li>Understand your growth</li>
        </ul>

        <button
          className="btn-primary"
          onClick={() => navigate("/contents?create=true")}
        >
          + Create your first content
        </button>
      </div>
    );
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="dashboard">
      <div className="dashboard__performance">
        <div className="dashboard__performance-header">
          <div>
            <h2>Performance</h2>
            <p>Activity within selected period</p>
          </div>

          <div className="dashboard__controls">
            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value as "7d" | "30d" | "90d")
              }
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        <KPISection data={data} growthVisual={growthVisual} />

        <DashboardChartsSection
          platformData={platformData}
          timelineData={timelineData}
          cumulativeData={cumulativeData}
        />

        <DashboardInsightsSection insights={insights} />
      </div>

      <div className="dashboard__consistency">
        <div className="dashboard__consistency-header">
          <h2>Consistency</h2>
          <p>Your publishing activity across the year</p>
        </div>

        <div className="dashboard__card heatmap-card">
          <ActivityHeatmap data={heatmapData} />
        </div>
      </div>
    </div>
  );
}