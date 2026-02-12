import { useEffect, useState } from "react";
import ContentsByPlatformChart from "../components/ContentByPlatformChart.tsx";
import "./Dashboard.scss";

/* =========================
   TYPES
========================= */

type DashboardData = {
  total_contents: number;
  platforms_used: number;
  reusable_contents?: number;
  last_activity: string | null;
};

type PlatformData = {
  platform_name: string;
  total_contents: number;
  percentage: number;
};

/* =========================
   COMPONENT
========================= */

export default function Dashboard() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [platformData, setPlatformData] =
    useState<PlatformData[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
      apikey:
        import.meta.env.VITE_SUPABASE_ANON_KEY,
    };

    /* =========================
       FETCH KPI DASHBOARD
    ========================= */

    const fetchDashboard = fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-dashboard`,
      { headers }
    ).then((res) => res.json());

    /* =========================
       FETCH PLATFORM DATA
    ========================= */

    const fetchPlatforms = fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-contents-by-platform`,
      { headers }
    ).then((res) => res.json());

    /* =========================
       EXECUTE BOTH
    ========================= */

    Promise.all([
      fetchDashboard,
      fetchPlatforms,
    ])
      .then(([dashboardRes, platformRes]) => {
        console.log(
          "Dashboard:",
          dashboardRes
        );
        console.log(
          "Platforms:",
          platformRes
        );

        setData(dashboardRes);
        setPlatformData(platformRes);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  /* =========================
     STATES
  ========================= */

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (!data) {
    return <p>No data available</p>;
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="dashboard">
      <h2 className="page__title">
        Dashboard
      </h2>

      {/* KPI CARDS */}

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
          <h3>
            {data.reusable_contents ?? 0}
          </h3>
        </div>

        <div className="kpi-card">
          <span>Last Activity</span>
          <h3>
            {data.last_activity
              ? new Date(
                  data.last_activity
                ).toLocaleDateString()
              : "—"}
          </h3>
        </div>

      </section>

      {/* PLATFORM CHART */}

      <section className="dashboard__section">

        <h3>Contents by Platform</h3>

        <div className="dashboard__card">

          <ContentsByPlatformChart
            data={platformData}
          />

        </div>

      </section>

    </div>
  );
}
