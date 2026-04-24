export type AnalyticsInsight = {
  code: string;
  title: string;
  insight: string;
  strategy: string;
  action: string;
  confidence: number;
};

export type StrategyInsight = {
  type: string;
  title: string;
  message: string;
  confidence: number;
};

export type TopIdea = {
  title: string;
  content_count: number;
};

export type PublishingRhythm = {
  avg_per_week: number;
  total_contents: number;
  weeks_active: number;
};

export type ContentDNA = {
  primary_topic: string | null;
  primary_format: string | null;
  primary_role: string | null;
  primary_format_percentage?: number;
  top_ideas: TopIdea[];
  topic_distribution: { topic: string; count: number; percentage: number }[];
  format_distribution: { format: string; count: number; percentage: number }[];
  role_distribution: { role: string; count: number; percentage: number }[];
  platform_distribution: { platform: string; count: number; percentage: number }[];
  publishing_rhythm: PublishingRhythm | null;
};

export type StrategyInsightsResponse = {
  content_dna: ContentDNA | null;

  top_content_engine: {
    idea_title: string;
    total_contents: number;
  } | null;

  content_engines: {
    idea_id: string;
    idea_title: string;
    tenant_id: string;
    total_contents: number;
    first_content_date: string;
    last_content_date: string;
    is_engine: boolean;
  }[];

  unused_ideas: {
    idea_title: string;
  }[];

  insights: StrategyInsight[];
};
