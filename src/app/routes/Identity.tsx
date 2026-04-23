import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import { useContentDNA } from "../../features/insights/hooks/useContentDNA.ts";
import { useIdentityAI } from "../../features/insights/hooks/useIdentityAI.ts";

import "./Identity.scss";

/* =========================
   TYPES
========================= */

type OutletContext = {
  setTopbarContext: (value: string | null) => void;
};

/* =========================
   COMPONENT
========================= */

export default function Identity() {
  const { setTopbarContext } = useOutletContext<OutletContext>();

  const { dna, loading: dnaLoading } = useContentDNA();

  const { result: aiResult, loading: aiLoading } = useIdentityAI(dna);

  /* =========================
     TOPBAR CONTEXT
  ========================= */

  useEffect(() => {
    setTopbarContext("Your creative identity");
    return () => setTopbarContext(null);
  }, [setTopbarContext]);

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

      {/* ── 1. HEADER ── */}

      <div className="identity-header">
        <h2>Creator Identity</h2>
        <p>Your creative fingerprint</p>
      </div>

      {/* ── 2. CONTENT DNA — STAT CARDS ── */}

      <section className="identity-section">
        <span className="section-label">Content DNA</span>

        <div className="identity-stat-grid">
          <div className="identity-stat-card">
            <span className="identity-stat-card__value">
              {dna?.publishing_rhythm?.total_contents ?? 0}
            </span>
            <span className="identity-stat-card__label">Total contents</span>
          </div>

          <div className="identity-stat-card">
            <span className="identity-stat-card__value">
              {dna?.top_ideas?.length ?? 0}
            </span>
            <span className="identity-stat-card__label">Ideas linked</span>
          </div>

          <div className="identity-stat-card">
            <span className="identity-stat-card__value">
              {dna?.topic_distribution?.length ?? 0}
            </span>
            <span className="identity-stat-card__label">Topics active</span>
          </div>

          <div className="identity-stat-card">
            <span className="identity-stat-card__value">
              {dna?.publishing_rhythm?.avg_per_week?.toFixed(1) ?? "—"}
            </span>
            <span className="identity-stat-card__label">Avg / week</span>
          </div>
        </div>
      </section>

      {/* ── 3. STANDOUT INSIGHTS ── */}

      {(aiLoading || (aiResult?.standout_insights?.length ?? 0) > 0) && (
        <section className="identity-section">
          <span className="section-label">Standout insights</span>

          <div className="identity-highlights">
            {aiLoading ? (
              <>
                <div className="identity-highlight-card identity-highlight-card--skeleton" />
                <div className="identity-highlight-card identity-highlight-card--skeleton" />
                <div className="identity-highlight-card identity-highlight-card--skeleton" />
              </>
            ) : (
              aiResult?.standout_insights.map((insight, i) => (
                <div key={i} className="identity-highlight-card">
                  <p>{insight}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ── 4. TOP TOPICS + FORMATS ── */}

      <div className="identity-two-col">
        <section className="identity-section">
          <span className="section-label">Top topics</span>

          <div className="identity-bars">
            {(dna?.topic_distribution ?? []).map((item) => (
              <div key={item.topic} className="identity-bars__row">
                <span className="identity-bars__label">{item.topic}</span>
                <div className="identity-bars__track">
                  <div
                    className="identity-bars__fill"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="identity-bars__percentage">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="identity-section">
          <span className="section-label">Formats</span>

          <div className="identity-bars">
            {(dna?.format_distribution ?? []).map((item) => (
              <div key={item.format} className="identity-bars__row">
                <span className="identity-bars__label">{item.format}</span>
                <div className="identity-bars__track">
                  <div
                    className="identity-bars__fill"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="identity-bars__percentage">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── 5. TOP IDEAS + PLATFORMS ── */}

      <div className="identity-two-col">
        <section className="identity-section">
          <span className="section-label">Top ideas</span>

          <ol className="identity-ideas-list">
            {(dna?.top_ideas ?? []).map((idea, i) => (
              <li key={i} className="identity-ideas-list__item">
                <span className="identity-ideas-list__rank">{i + 1}</span>
                <span className="identity-ideas-list__title">{idea.title}</span>
                <span className="identity-ideas-list__count">
                  {idea.content_count}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="identity-section">
          <span className="section-label">Platforms</span>

          <div className="identity-bars">
            {(dna?.platform_distribution ?? []).map((item) => (
              <div key={item.platform} className="identity-bars__row">
                <span className="identity-bars__label">{item.platform}</span>
                <div className="identity-bars__track">
                  <div
                    className="identity-bars__fill"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="identity-bars__percentage">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── 6. CONTENT ROLES ── */}

      <section className="identity-section">
        <span className="section-label">Content roles</span>

        <div className="identity-role-grid">
          {(dna?.role_distribution ?? []).map((item) => (
            <div key={item.role} className="identity-stat-card">
              <span className="identity-stat-card__value">
                {item.percentage}%
              </span>
              <span className="identity-stat-card__label">{item.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. CREATIVE STYLE ── */}

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
              aiResult?.creative_style_tags.map((tag, i) => (
                <span
                  key={i}
                  className={`identity-tag ${i < 3 ? "identity-tag--active" : ""}`}
                >
                  {tag}
                </span>
              ))
            )}
          </div>
        </section>
      )}

    </div>
  );
}
