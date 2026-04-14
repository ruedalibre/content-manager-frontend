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

export type ContentDNA = {
  primary_topic: string | null;
  primary_format: string | null;
  primary_role: string | null;
  top_ideas?: string[];
  topic_distribution?: {
    topic: string;
    percentage: number;
    count?: number;
    total?: number;
  }[];
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
