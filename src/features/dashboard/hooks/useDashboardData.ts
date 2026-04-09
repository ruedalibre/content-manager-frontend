import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

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

export type StrategyInsight = {
  type: string;
  title: string;
  message: string;
  confidence?: number;
};

type ContentDNA = {
  primary_topic: string | null;
  primary_format: string | null;
  primary_role: string | null;
  top_ideas?: string[];
  topic_distribution?: {
    topic: string;
    percentage: number;
  }[];
};

/* =========================
   HOOK
========================= */

export function useDashboardData(period: "7d" | "30d" | "90d") {
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<DashboardData | null>(null);
  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [timelineData, setTimelineData] = useState<GrowthTimelineData[]>([]);
  const [cumulativeData, setCumulativeData] = useState<CumulativeGrowthData[]>(
    [],
  );
  const [growthRateData, setGrowthRateData] = useState<GrowthRateData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [strategyInsights, setStrategyInsights] = useState<StrategyInsight[]>(
    [],
  );
  const [contentDNA, setContentDNA] = useState<ContentDNA | null>(null);

  /* =========================
     LOAD DASHBOARD
  ========================= */

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers = {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        };

        const baseUrl = import.meta.env.VITE_SUPABASE_URL;

        /* =========================
           DASHBOARD SUMMARY
        ========================= */

        const dashboardRes = await fetch(
          `${baseUrl}/functions/v1/me-dashboard?period=${period}`,
          { headers },
        ).then((r) => r.json());

        setData(dashboardRes);

        /* =========================
           EMPTY ACCOUNT
        ========================= */

        if (dashboardRes.total_contents === 0) {
          setPlatformData([]);
          setTimelineData([]);
          setCumulativeData([]);
          setGrowthRateData([]);
          setHeatmapData([]);
          setInsights([]);
          setStrategyInsights([]);
          setContentDNA(null);

          setLoading(false);
          return;
        }

        /* =========================
           PARALLEL FETCH
        ========================= */

        const [
          platformRes,
          timelineRes,
          cumulativeRes,
          growthRateRes,
          heatmapRes,
          insightsRes,
          strategyRes,
        ] = await Promise.all([
          fetch(
            `${baseUrl}/functions/v1/me-contents-by-platform?period=${period}`,
            { headers },
          ).then((r) => r.json()),

          fetch(
            `${baseUrl}/functions/v1/admin-content-growth?period=${period}`,
            { headers },
          ).then((r) => r.json()),

          fetch(
            `${baseUrl}/functions/v1/admin-content-growth-cumulative?period=${period}`,
            { headers },
          ).then((r) => r.json()),

          fetch(
            `${baseUrl}/functions/v1/admin-content-growth-rate?period=${period}`,
            { headers },
          ).then((r) => r.json()),

          fetch(`${baseUrl}/functions/v1/me-activity-heatmap`, {
            headers,
          }).then((r) => r.json()),

          fetch(`${baseUrl}/functions/v1/me-insights?period=${period}`, {
            headers,
          }).then((r) => r.json()),

          fetch(`${baseUrl}/functions/v1/strategy-insights`, { headers }).then(
            (r) => r.json(),
          ),
        ]);

        /* =========================
           SET STATE
        ========================= */

        setPlatformData(platformRes);
        setTimelineData(timelineRes);
        setCumulativeData(cumulativeRes);
        setGrowthRateData(growthRateRes);
        setHeatmapData(heatmapRes);
        setInsights(insightsRes);

        setStrategyInsights(strategyRes.insights || []);
        setContentDNA(strategyRes.content_dna || null);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [period]);

  /* =========================
     RETURN
  ========================= */

  return {
    loading,

    data,
    platformData,
    timelineData,
    cumulativeData,
    growthRateData,
    heatmapData,

    insights,
    strategyInsights,

    contentDNA,
  };
}
