export type DashboardData = {
  total_contents: number;
  platforms_used: number;
  total_all_time: number;
  ideas_without_brief: number;
};

export type PlatformData = {
  platform_name: string;
  total_contents: number;
  percentage: number;
};

export type TimelineData = {
  month: string;
  total_contents: number;
};

export type CumulativeGrowthData = {
  month: string;
  cumulative_total: number;
};

export type GrowthRateData = {
  month: string;
  total_contents: number;
  growth_rate: number;
};

export type HeatmapData = {
  activity_date: string;
  total_contents: number;
};
