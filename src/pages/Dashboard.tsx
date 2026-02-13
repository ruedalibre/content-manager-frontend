import { useEffect, useState } from "react";
import ContentsByPlatformChart from "../components/ContentByPlatformChart.tsx";
import ContentGrowthTimelineChart from "../components/ContentGrowthTimelineChart.tsx";
import ContentGrowthCumulativeChart from "../components/ContentGrowthCumulativeChart.tsx";
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

/* Timeline mensual */
type GrowthTimelineData = {
  month: string; // "2026-01"
  total_contents: number;
};

/* Growth acumulado */
type CumulativeGrowthData = {
  month: string;
  total_contents: number;
  cumulative_total: number;
};

/* =========================
   COMPONENT
========================= */

export default function Dashboard() {
  /* =========================
     STATES
  ========================= */

  const [data, setData] =
    useState<DashboardData | null>(null);

  const [platformData, setPlatformData] =
    useState<PlatformData[]>([]);

  const [timelineData, setTimelineData] =
    useState<GrowthTimelineData[]>([]);

  const [cumulativeData, setCumulativeData] =
    useState<CumulativeGrowthData[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* =========================
     DATA FETCHING
  ========================= */

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    };

    /* -------------------------
       FETCH — KPI DASHBOARD
    ------------------------- */

    const fetchDashboard:
      Promise<DashboardData> = fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-dashboard`,
        { headers }
      ).then((res) => res.json());

    /* -------------------------
       FETCH — CONTENTS BY PLATFORM
    ------------------------- */

    const fetchPlatforms:
      Promise<PlatformData[]> = fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-contents-by-platform`,
        { headers }
      ).then((res) => res.json());

    /* -------------------------
       FETCH — CONTENT GROWTH (MONTHLY)
    ------------------------- */

    const fetchGrowth:
      Promise<GrowthTimelineData[]> = fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content-growth`,
        { headers }
      ).then((res) => res.json());

    /* -------------------------
       FETCH — CUMULATIVE GROWTH
    ------------------------- */

    const fetchCumulative:
      Promise<CumulativeGrowthData[]> = fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content-growth-cumulative`,
        { headers }
      ).then((res) => res.json());

    /* -------------------------
       EXECUTE ALL FETCHES
    ------------------------- */

    Promise.all([
      fetchDashboard,
      fetchPlatforms,
      fetchGrowth,
      fetchCumulative,
    ])
      .then(
        ([
          dashboardRes,
          platformRes,
          growthRes,
          cumulativeRes,
        ]) => {
          console.log("Dashboard:", dashboardRes);
          console.log("Platforms:", platformRes);
          console.log("Growth:", growthRes);
          console.log("Cumulative:", cumulativeRes);

          setData(dashboardRes);
          setPlatformData(platformRes);
          setTimelineData(growthRes);
          setCumulativeData(cumulativeRes);

          setLoading(false);
        }
      )
      .catch((err) => {
        console.error(
          "Dashboard fetch error:",
          err
        );
        setLoading(false);
      });
  }, []);

  /* =========================
     LOADING STATE
  ========================= */

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  /* =========================
     EMPTY STATE
  ========================= */

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

      {/* =====================
          KPI CARDS
      ===================== */}

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

      {/* =====================
          PLATFORM CHART
      ===================== */}

      <section className="dashboard__section">
        <h3>
          Contents by Platform
        </h3>

        <div className="dashboard__card">
          <ContentsByPlatformChart
            data={platformData}
          />
        </div>
      </section>

      {/* =====================
          CONTENT GROWTH TIMELINE
      ===================== */}

      <section className="dashboard__section">
        <h3>
          Content Growth Timeline
        </h3>

        <div className="dashboard__card">
          <ContentGrowthTimelineChart
            data={timelineData}
          />
        </div>
      </section>

      {/* =====================
          CUMULATIVE GROWTH
      ===================== */}

      <section className="dashboard__section">
        <h3>
          Cumulative Content Growth
        </h3>

        <div className="dashboard__card">
          <ContentGrowthCumulativeChart
            data={cumulativeData}
          />
        </div>
      </section>
    </div>
  );
}
