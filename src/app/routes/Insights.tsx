import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import { useDashboardData } from "../../features/dashboard/hooks/useDashboardData";

import ContentDNACard from "../../features/dashboard/components/ContentDNACard";
import StrategyInsightsSection from "../../features/dashboard/components/StrategyInsightsSection";
import DashboardInsightsSection from "../../features/dashboard/components/DashboardInsightsSection";

import "./Insights.scss";

/* =========================
   TYPES
========================= */

type OutletContext = {
  setTopbarContext: (value: string | null) => void;
};

/* =========================
   COMPONENT
========================= */

export default function Insights() {
  const { contentDNA, insights, strategyInsights, loading } =
    useDashboardData("30d");

  const { setTopbarContext } = useOutletContext<OutletContext>();

  /* =========================
     TOPBAR CONTEXT
  ========================= */

  useEffect(() => {
    if (loading) {
      setTopbarContext("Loading insights...");
      return;
    }

    setTopbarContext("Content strategy insights");

    return () => setTopbarContext(null);
  }, [loading, setTopbarContext]);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="insights-page">
        <p>Loading insights...</p>
      </div>
    );
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="insights-page">
      {/* PAGE HEADER */}

      <div className="insights-header">
        <h2>Your content strategy</h2>

        <p>
          Discover patterns, opportunities, and strategic signals emerging from
          your content.
        </p>
      </div>

      {/* CONTENT DNA */}

      {contentDNA && (
        <section className="insights-section">
          <ContentDNACard dna={contentDNA} />
        </section>
      )}

      {/* STRATEGY INSIGHTS */}

      {strategyInsights.length > 0 && (
        <section className="insights-section">
          <StrategyInsightsSection insights={strategyInsights} />
        </section>
      )}

      {/* SMART INSIGHTS */}

      {insights.length > 0 && (
        <section className="insights-section">
          <DashboardInsightsSection insights={insights} />
        </section>
      )}
    </div>
  );
}
