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

export function useDashboardData(
  period: "7d" | "30d" | "90d",
  workspaceId: string | null,
) {
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
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers = {
          Authorization: `Bearer ${session?.access_token}`,
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
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-dashboard?period=${period}&workspace_id=${workspaceId}`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-contents-by-platform?period=${period}&workspace_id=${workspaceId}`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-activity-heatmap?workspace_id=${workspaceId}`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-content-growth?period=${period}&workspace_id=${workspaceId}`,
            { headers },
          ),
          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-content-growth-cumulative?period=${period}&workspace_id=${workspaceId}`,
            { headers },
          ),
          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-content-growth-rate?period=${period}&workspace_id=${workspaceId}`,
            { headers },
          ),

          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me-insights?period=${period}&workspace_id=${workspaceId}`,
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
  }, [period, workspaceId]);

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
