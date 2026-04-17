import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient.ts";

import {
  type DashboardData,
  type PlatformData,
  type TimelineData,
  type CumulativeGrowthData,
  type GrowthRateData,
  type HeatmapData,
} from "../types/dashboard.types.ts";

import { type AnalyticsInsight } from "../../insights/types/insights.types.ts";

/* =========================
   HOOK
========================= */

export function useDashboardData(period: "7d" | "30d" | "90d") {
  const [data, setData] = useState<DashboardData | null>(null);

  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [cumulativeData, setCumulativeData] = useState<CumulativeGrowthData[]>(
    [],
  );
  const [growthRateData, setGrowthRateData] = useState<GrowthRateData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);

  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers = {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        };

        /* =========================
           PARALLEL REQUESTS
        ========================= */

        const [
          dashboardRes,
          platformRes,
          heatmapRes,
          growthRes,
          cumulativeRes,
          rateRes,
          insightsRes,
        ] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-dashboard?period=${period}`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-contents-by-platform?period=${period}`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-activity-heatmap`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content-growth?period=${period}`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content-growth-cumulative?period=${period}`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content-growth-rate?period=${period}`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-insights?period=${period}`,
            { headers },
          ),
        ]);

        /* =========================
           PARSE RESPONSES
        ========================= */

        const dashboardJson: DashboardData = await dashboardRes.json();
        const platformJson: PlatformData[] = await platformRes.json();
        const heatmapJson: HeatmapData[] = await heatmapRes.json();
        const growthJson: TimelineData[] = await growthRes.json();
        const cumulativeJson: CumulativeGrowthData[] =
          await cumulativeRes.json();
        const rateJson: GrowthRateData[] = await rateRes.json();
        const insightsJson: AnalyticsInsight[] = await insightsRes.json();

        /* =========================
           SET STATE
        ========================= */

        setData(dashboardJson ?? null);
        setPlatformData(platformJson ?? []);
        setHeatmapData(heatmapJson ?? []);
        setTimelineData(growthJson ?? []);
        setCumulativeData(cumulativeJson ?? []);
        setGrowthRateData(rateJson ?? []);
        setInsights(insightsJson ?? []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [period]);

  return {
    data,
    platformData,
    timelineData,
    cumulativeData,
    growthRateData,
    heatmapData,
    insights,
    loading,
  };
}
