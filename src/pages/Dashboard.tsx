import { useEffect, useState } from "react";
import ContentsByPlatformChart from "../components/Charts/ContentByPlatformChart.tsx";
import ContentGrowthTimelineChart from "../components/Charts/ContentGrowthTimelineChart.tsx";
import ContentGrowthCumulativeChart from "../components/Charts/ContentGrowthCumulativeChart.tsx";
import ActivityHeatmap from "../components/Charts/ActivityHeatmap.tsx";
import InsightsPanel from "../components/Charts/InsightsPanel.tsx";
import { useOutletContext } from "react-router-dom";
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
  growth_rate: number | null;
};

type HeatmapData = {
  activity_date: string;
  total_contents: number;
};

type Insight = {
  title: string;
  message: string;
};

type OutletContext = {
  setTopbarContext: (value: string | null) => void;
};

/* =========================
   COMPONENT
========================= */

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [timelineData, setTimelineData] = useState<GrowthTimelineData[]>([]);
  const [cumulativeData, setCumulativeData] = useState<CumulativeGrowthData[]>(
    [],
  );
  const [growthRateData, setGrowthRateData] = useState<GrowthRateData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const { setTopbarContext } = useOutletContext<OutletContext>();

  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  /* =========================
     DATA FETCHING
  ========================= */

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const headers = {
          Authorization: `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        };

        const baseUrl = import.meta.env.VITE_SUPABASE_URL;

        const fetchDashboard = fetch(
          `${baseUrl}/functions/v1/me-dashboard?period=${period}`,
          { headers },
        ).then((res) => res.json());

        const fetchPlatforms = fetch(
          `${baseUrl}/functions/v1/me-contents-by-platform?period=${period}`,
          { headers },
        ).then((res) => res.json());

        const fetchGrowth = fetch(
          `${baseUrl}/functions/v1/admin-content-growth?period=${period}`,
          { headers },
        ).then((res) => res.json());

        const fetchCumulative = fetch(
          `${baseUrl}/functions/v1/admin-content-growth-cumulative?period=${period}`,
          { headers },
        ).then((res) => res.json());

        const fetchGrowthRate = fetch(
          `${baseUrl}/functions/v1/admin-content-growth-rate?period=${period}`,
          { headers },
        ).then((res) => res.json());

        const fetchHeatmap = fetch(
          `${baseUrl}/functions/v1/me-activity-heatmap?period=${period}`,
          { headers },
        ).then((res) => res.json());

        const fetchInsights = fetch(
          `${baseUrl}/functions/v1/me-insights?period=${period}`,
          { headers },
        ).then((res) => res.json());

        const [
          dashboardRes,
          platformRes,
          growthRes,
          cumulativeRes,
          growthRateRes,
          heatmapRes,
          insightsRes,
        ] = await Promise.all([
          fetchDashboard,
          fetchPlatforms,
          fetchGrowth,
          fetchCumulative,
          fetchGrowthRate,
          fetchHeatmap,
          fetchInsights,
        ]);

        setData(dashboardRes);
        setPlatformData(platformRes);
        setTimelineData(growthRes);
        setCumulativeData(cumulativeRes);
        setGrowthRateData(growthRateRes);
        setHeatmapData(heatmapRes);
        setInsights(insightsRes);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [period]);

  /* =========================
     MICRO CONTEXT
  ========================= */

  useEffect(() => {
    if (loading) {
      setTopbarContext("Loading...");
      return;
    }

    if (data) {
      const periodLabels = {
        "7d": "Last 7 days",
        "30d": "Last 30 days",
        "90d": "Last 90 days",
      };

      setTopbarContext(
        `${data.total_contents} active contents · ${periodLabels[period]}`,
      );
    }

    return () => {
      setTopbarContext(null);
    };
  }, [loading, data, period, setTopbarContext]);

  useEffect(() => {
    console.log("PERIOD:", period);
    console.log("GROWTH RATE DATA:", growthRateData);
  }, [growthRateData, period]);

  /* =========================
     LOADING STATES
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
      ? (growthRateData.at(-1)?.growth_rate ?? null)
      : null;

  const roundedRate =
    latestGrowthRate !== null && latestGrowthRate !== undefined
      ? Math.round(latestGrowthRate)
      : null;

  const getGrowthRateVisual = (rate: number | null) => {
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

  const growthVisual = getGrowthRateVisual(roundedRate);

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="dashboard">
      {/* Period Selector */}
      <div className="dashboard__controls">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as "7d" | "30d" | "90d")}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

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
          <h3>{data.reusable_contents ?? 0}</h3>
        </div>

        <div className="kpi-card">
          <span>Growth Rate</span>
          <h3 className={`growth-rate ${growthVisual.className}`}>
            <span className="growth-rate__arrow">{growthVisual.arrow}</span>
            {growthVisual.label}
          </h3>
        </div>

        <div className="kpi-card">
          <span>Last Activity</span>
          <h3>
            {data.last_activity
              ? new Date(data.last_activity).toLocaleDateString()
              : "—"}
          </h3>
        </div>
      </section>

      {/* Rest of your sections remain unchanged */}

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
        <h3>Cumulative Content Growth</h3>
        <div className="dashboard__card">
          <ContentGrowthCumulativeChart data={cumulativeData} />
        </div>
      </section>

      <section className="dashboard__section">
        <h3>Activity Heatmap</h3>
        <div className="dashboard__card heatmap-card">
          <ActivityHeatmap data={heatmapData} />
        </div>
      </section>

      <section className="dashboard__section">
        <h3>Smart Insights</h3>
        <InsightsPanel data={insights} />
      </section>
    </div>
  );
}
