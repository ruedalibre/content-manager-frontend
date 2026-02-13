import { useEffect, useState } from "react";
import ContentsByPlatformChart from "../components/ContentByPlatformChart.tsx";
import ContentGrowthTimelineChart from "../components/ContentGrowthTimelineChart.tsx";
import ContentGrowthCumulativeChart from "../components/ContentGrowthCumulativeChart.tsx";
import ActivityHeatmap from "../components/ActivityHeatmap.tsx";
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

type GrowthTimelineData = {
  month: string;
  total_contents: number;
};

type CumulativeGrowthData = {
  month: string;
  total_contents: number;
  cumulative_total: number;
};

type GrowthRateData = {
  month: string;
  total_contents: number;
  previous_total: number | null;
  growth_rate_percent: number | null;
};

/* Heatmap */

type HeatmapData = {
  activity_date: string;
  total_contents: number;
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

  const [growthRateData, setGrowthRateData] =
    useState<GrowthRateData[]>([]);

  const [heatmapData, setHeatmapData] =
    useState<HeatmapData[]>([]);

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

    const fetchDashboard = fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-dashboard`,
      { headers },
    ).then((res) => res.json());

    const fetchPlatforms = fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-contents-by-platform`,
      { headers },
    ).then((res) => res.json());

    const fetchGrowth = fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content-growth`,
      { headers },
    ).then((res) => res.json());

    const fetchCumulative = fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content-growth-cumulative`,
      { headers },
    ).then((res) => res.json());

    const fetchGrowthRate = fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content-growth-rate`,
      { headers },
    ).then((res) => res.json());

    const fetchHeatmap = fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-activity-heatmap`,
      { headers },
    ).then((res) => res.json());

    Promise.all([
      fetchDashboard,
      fetchPlatforms,
      fetchGrowth,
      fetchCumulative,
      fetchGrowthRate,
      fetchHeatmap,
    ])
      .then(
        ([
          dashboardRes,
          platformRes,
          growthRes,
          cumulativeRes,
          growthRateRes,
          heatmapRes,
        ]) => {
          setData(dashboardRes);
          setPlatformData(platformRes);
          setTimelineData(growthRes);
          setCumulativeData(cumulativeRes);
          setGrowthRateData(growthRateRes);
          setHeatmapData(heatmapRes);

          setLoading(false);
        },
      )
      .catch((err) => {
        console.error(
          "Dashboard fetch error:",
          err,
        );
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
     GROWTH RATE LOGIC
  ========================= */

  const latestGrowthRate =
    growthRateData.length > 0
      ? growthRateData.at(-1)
          ?.growth_rate_percent
      : null;

  const roundedRate =
    latestGrowthRate !== null &&
    latestGrowthRate !== undefined
      ? Math.round(latestGrowthRate)
      : null;

  const getGrowthRateVisual = (
    rate: number | null,
  ) => {
    if (rate === null) {
      return {
        label: "—",
        className: "neutral",
        arrow: "",
      };
    }

    if (rate > 0) {
      return {
        label: `+${rate}%`,
        className: "positive",
        arrow: "↑",
      };
    }

    if (rate < 0) {
      return {
        label: `${rate}%`,
        className: "negative",
        arrow: "↓",
      };
    }

    return {
      label: "0%",
      className: "neutral",
      arrow: "→",
    };
  };

  const growthVisual =
    getGrowthRateVisual(roundedRate);

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

        {/* Growth KPI */}

        <div className="kpi-card">
          <span>Growth Rate</span>

          <h3
            className={`growth-rate ${growthVisual.className}`}
          >
            <span className="growth-rate__arrow">
              {growthVisual.arrow}
            </span>

            {growthVisual.label}
          </h3>
        </div>

        <div className="kpi-card">
          <span>Last Activity</span>
          <h3>
            {data.last_activity
              ? new Date(
                  data.last_activity,
                ).toLocaleDateString()
              : "—"}
          </h3>
        </div>
      </section>

      {/* PLATFORM */}

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

      {/* TIMELINE */}

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

      {/* CUMULATIVE */}

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

      {/* HEATMAP */}

      <section className="dashboard__section">
        <h3>Activity Heatmap</h3>

        <div className="dashboard__card heatmap-card">
          <ActivityHeatmap
            data={heatmapData}
          />
        </div>
      </section>
    </div>
  );
}
