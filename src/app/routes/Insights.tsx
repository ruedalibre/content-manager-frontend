import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import { useContentDNA } from "../../features/insights/hooks/useContentDNA.ts";
import { useStrategyInsights } from "../../features/insights/hooks/useStrategyInsights.ts";
import { useAnalyticsInsights } from "../../features/insights/hooks/useAnalyticsInsights.ts";

import ContentDNACard from "../../features/insights/components/ContentDNACard.tsx";
import StrategyInsightsSection from "../../features/insights/components/StrategyInsightsSection.tsx";
import SmartInsightsSection from "../../features/insights/components/SmartInsightsSection.tsx";

import "./Insights.scss";

type OutletContext = {
  setTopbarContext: (value: string | null) => void;
};

export default function Insights() {
  const { setTopbarContext } = useOutletContext<OutletContext>();

  const { dna, loading: dnaLoading } = useContentDNA();
  const { insights: strategyInsights } = useStrategyInsights();
  const { insights: analyticsInsights } = useAnalyticsInsights("30d");

  useEffect(() => {
    setTopbarContext("Content strategy insights");
    return () => setTopbarContext(null);
  }, []);

  if (dnaLoading) {
    return (
      <div className="insights-page">
        <p>Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="insights-page">
      <div className="insights-header">
        <h2>Your content strategy</h2>
        <p>
          Discover patterns, opportunities, and strategic signals emerging from
          your content.
        </p>
      </div>

      <ContentDNACard dna={dna} />

      <StrategyInsightsSection insights={strategyInsights} />

      <SmartInsightsSection insights={analyticsInsights} />
    </div>
  );
}
