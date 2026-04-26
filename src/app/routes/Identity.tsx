import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { useContentDNA } from "../../features/insights/hooks/useContentDNA.ts";
import { useAnalyticsInsights } from "../../features/insights/hooks/useAnalyticsInsights.ts";
import { useIdentityAI } from "../../features/insights/hooks/useIdentityAI.ts";
import { useCreativeInsights } from "../../features/insights/hooks/useCreativeInsights.ts";

import { type AnalyticsInsight } from "../../features/insights/types/insights.types.ts";

import "./Identity.scss";

/* =========================
   TYPES
========================= */

type OutletContext = {
  setTopbarContext: (value: string | null) => void;
};

type InsightExpanderProps = {
  code: string;
  insights: AnalyticsInsight[];
  expanded: Record<string, boolean>;
  onToggle: (code: string) => void;
};

/* =========================
   SUBCOMPONENTS
========================= */

function InsightExpander({ code, insights, expanded, onToggle }: InsightExpanderProps) {
  const insight = insights.find((i) => i.code === code) ?? null;
  if (!insight) return null;

  return (
    <div className="identity-insight-expander">
      <button
        className="identity-insight-toggle"
        onClick={() => onToggle(code)}
      >
        {expanded[code] ? "Hide insight" : "See insight"}
      </button>

      {expanded[code] && (
        <div className="identity-insight-body">
          <p className="identity-insight-body__insight">{insight.insight}</p>
          <p className="identity-insight-body__strategy">{insight.strategy}</p>
          <p className="identity-insight-body__action">{insight.action}</p>
        </div>
      )}
    </div>
  );
}

function Collapsible({
  icon,
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="identity-collapsible">
      <div className="identity-collapsible__header" onClick={onToggle}>
        <div className="identity-collapsible__left">
          <span className="identity-collapsible__icon">{icon}</span>
          <div>
            <div className="identity-collapsible__title">{title}</div>
            <div className="identity-collapsible__subtitle">{subtitle}</div>
          </div>
        </div>
        <span
          className={`identity-collapsible__chevron${
            isOpen ? " identity-collapsible__chevron--open" : ""
          }`}
        >
          ▸
        </span>
      </div>
      {isOpen && (
        <div className="identity-collapsible__body">{children}</div>
      )}
    </div>
  );
}

/* =========================
   COMPONENT
========================= */

export default function Identity() {
  const { setTopbarContext } = useOutletContext<OutletContext>();

  const { dna, loading: dnaLoading } = useContentDNA();
  const { insights: analyticsInsights } = useAnalyticsInsights("30d");
  const { result: aiResult, loading: aiLoading } = useIdentityAI(dna);
  const { insights: creativeInsights, loading: creativeInsightsLoading } = useCreativeInsights();

  const [expandedInsights, setExpandedInsights] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    reflecting: false,
    deep: false,
  });

  const toggleInsight = (code: string) => {
    setExpandedInsights((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* =========================
     TOPBAR CONTEXT
  ========================= */

  useEffect(() => {
    setTopbarContext("Your creative identity");
    return () => setTopbarContext(null);
  }, [setTopbarContext]);

  /* =========================
     HELPERS
  ========================= */

  const getInsight = (code: string) =>
    analyticsInsights.find((i) => i.code === code) ?? null;

  /* =========================
     LOADING
  ========================= */

  if (dnaLoading) {
    return (
      <div className="identity-page">
        <p>Loading your identity...</p>
      </div>
    );
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="identity-page">

      {/* ── HEADER ── */}

      <div className="identity-header">
        <h2>Creator Identity</h2>
        <p>Your creative fingerprint</p>
      </div>

      {/* ── ROW 1 — Top ideas + Top topics ── */}

      <div className="identity-row-two">

        <div className="identity-pattern-card">
          <span className="section-label">Top ideas</span>
          <ol className="identity-ideas-list">
            {(dna?.top_ideas ?? []).map((idea, i) => (
              <li key={i} className="identity-ideas-list__item">
                <span className="identity-ideas-list__rank">{i + 1}</span>
                <span className="identity-ideas-list__title">{idea.title}</span>
                <span className="identity-ideas-list__count">
                  {idea.content_count} {idea.content_count === 1 ? "content" : "contents"}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="identity-pattern-card">
          <span className="section-label">Top topics</span>
          <div className="identity-bars">
            {(dna?.topic_distribution ?? []).map((item) => (
              <div key={item.topic} className="identity-bars__row">
                <span className="identity-bars__label">{item.topic}</span>
                <div className="identity-bars__track">
                  <div className="identity-bars__fill"
                    style={{ width: `${item.percentage}%` }} />
                </div>
                <span className="identity-bars__percentage">{item.percentage}%</span>
              </div>
            ))}
          </div>
          <InsightExpander
            code="dominant_topic"
            insights={analyticsInsights}
            expanded={expandedInsights}
            onToggle={toggleInsight}
          />
        </div>

      </div>

      {/* ── ROW 2 — Content roles ancho completo ── */}

      <div className="identity-pattern-card" style={{ marginBottom: "12px" }}>
        <span className="section-label">Content roles</span>
        <div className="identity-roles-row">
          {(dna?.role_distribution ?? []).map((item) => (
            <div key={item.role} className="identity-stat-card">
              <span className="identity-stat-card__value">{item.percentage}%</span>
              <span className="identity-stat-card__label">{item.role}</span>
            </div>
          ))}
        </div>
        <InsightExpander
          code="content_role"
          insights={analyticsInsights}
          expanded={expandedInsights}
          onToggle={toggleInsight}
        />
      </div>

      {/* ── ROW 3 — Platforms + Formats ── */}

      <div className="identity-row-two">

        <div className="identity-pattern-card">
          <span className="section-label">Platforms</span>
          <div className="identity-bars">
            {(dna?.platform_distribution ?? []).map((item) => (
              <div key={item.platform} className="identity-bars__row">
                <span className="identity-bars__label">{item.platform}</span>
                <div className="identity-bars__track">
                  <div className="identity-bars__fill"
                    style={{ width: `${item.percentage}%` }} />
                </div>
                <span className="identity-bars__percentage">{item.percentage}%</span>
              </div>
            ))}
          </div>
          <InsightExpander
            code="top_platform"
            insights={analyticsInsights}
            expanded={expandedInsights}
            onToggle={toggleInsight}
          />
        </div>

        <div className="identity-pattern-card">
          <span className="section-label">Formats</span>
          <div className="identity-bars">
            {(dna?.format_distribution ?? []).map((item) => (
              <div key={item.format} className="identity-bars__row">
                <span className="identity-bars__label">{item.format}</span>
                <div className="identity-bars__track">
                  <div className="identity-bars__fill"
                    style={{ width: `${item.percentage}%` }} />
                </div>
                <span className="identity-bars__percentage">{item.percentage}%</span>
              </div>
            ))}
          </div>
          <InsightExpander
            code="best_format"
            insights={analyticsInsights}
            expanded={expandedInsights}
            onToggle={toggleInsight}
          />
        </div>

      </div>

      {/* ── STANDOUT INSIGHTS — siempre visible ── */}

      {(aiLoading || (aiResult?.standout_insights?.length ?? 0) > 0) && (
        <section className="identity-section">
          <span className="section-label">Standout insights</span>
          <div className="identity-highlights">
            {aiLoading ? (
              <>
                <div className="identity-highlight-card identity-highlight-card--skeleton" />
                <div className="identity-highlight-card identity-highlight-card--skeleton" />
              </>
            ) : (
              <>
                {aiResult?.standout_insights.slice(0, 2).map((insight, i) => (
                  <div key={i} className="identity-highlight-card">
                    <span className="identity-highlight-card__title">{insight.title}</span>
                    <p>{insight.text}</p>
                  </div>
                ))}
                {getInsight("content_production") && (
                  <div className="identity-highlight-card">
                    <p>
                      {getInsight("content_production")!.insight}{" "}
                      {getInsight("content_production")!.strategy}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ── CREATIVE STYLE — siempre visible ── */}

      {(aiLoading || (aiResult?.creative_style_tags?.length ?? 0) > 0) && (
        <section className="identity-section">
          <span className="section-label">Creative style</span>
          <div className="identity-tags">
            {aiLoading ? (
              <>
                {[80, 110, 95, 130, 75].map((w, i) => (
                  <span
                    key={i}
                    className="identity-tag identity-tag--skeleton"
                    style={{ width: w }}
                  />
                ))}
              </>
            ) : (
              aiResult?.creative_style_tags.map((item, i) => (
                <span
                  key={i}
                  className={`identity-tag ${item.active ? "identity-tag--active" : ""}`}
                >
                  {item.tag}
                </span>
              ))
            )}
          </div>
        </section>
      )}

      {/* ── WORTH REFLECTING ON — colapsable ── */}

      <Collapsible
        icon="🔍"
        title="Worth reflecting on"
        subtitle="Patterns you might have missed"
        isOpen={openSections.reflecting}
        onToggle={() => toggleSection("reflecting")}
      >
        {creativeInsightsLoading ? (
          <>
            <div className="identity-insight-card identity-insight-card--skeleton" />
            <div className="identity-insight-card identity-insight-card--skeleton" />
          </>
        ) : creativeInsights.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
            Not enough data yet to generate insights.
          </p>
        ) : (
          creativeInsights.map((insight, i) => (
            <div key={i} className="identity-insight-card">
              <span className="identity-insight-card__label">{insight.label}</span>
              <p className="identity-insight-card__text">{insight.text}</p>
            </div>
          ))
        )}
      </Collapsible>

      {/* ── DEEP ANALYSIS — colapsable ── */}

      <Collapsible
        icon="✦"
        title="Deep analysis"
        subtitle="Full creative report · on demand"
        isOpen={openSections.deep}
        onToggle={() => toggleSection("deep")}
      >
        <div className="identity-report-placeholder">
          <p className="identity-report-placeholder__title">
            Your creative report
          </p>
          <p className="identity-report-placeholder__sub">
            A narrative analysis of your creative identity,
            your strongest opportunities, and where the
            conversation around your topics is heading.
          </p>
          <button className="btn-primary" disabled>
            Coming soon
          </button>
        </div>
      </Collapsible>

    </div>
  );
}
