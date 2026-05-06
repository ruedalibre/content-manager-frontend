import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardData } from "../../features/dashboard/hooks/useDashboardData.ts";

import KPISection from "../../features/dashboard/components/KPISection.tsx";
import DashboardChartsSection from "../../features/dashboard/components/DashboardChartsSection.tsx";
import DashboardConsistencySection from "../../features/dashboard/components/DashboardConsistencySection.tsx";

import { getGrowthVisual } from "../../utils/growthRate.ts";

import { useOutletContext, useNavigate } from "react-router-dom";

import "./Activity.scss";

/* =========================
   TYPES
========================= */

type OutletContext = {
  setTopbarContext: (value: string | null) => void;
};

/* =========================
   COMPONENT
========================= */

export default function Dashboard() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const {
    data,
    platformData,
    timelineData,
    cumulativeData,
    growthRateData,
    heatmapData,
    loading,
  } = useDashboardData(period);

  const growthVisual = getGrowthVisual(growthRateData);

  const { t } = useTranslation();
  const { setTopbarContext } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  /* =========================
     MICRO CONTEXT
  ========================= */

  useEffect(() => {
    if (loading) {
      setTopbarContext(t("activity.loadingActivity"));
      return;
    }

    if (data) {
      const labels = {
        "7d": t("activity.last7days"),
        "30d": t("activity.last30days"),
        "90d": t("activity.last90days"),
      };

      setTopbarContext(`${data.total_contents} contents · ${labels[period]}`);
    }

    return () => setTopbarContext(null);
  }, [loading, data, period, setTopbarContext]);

  /* =========================
     LOADING
  ========================= */

  if (loading) return <p>{t("activity.loadingActivity")}</p>;
  if (!data) return <p>{t("activity.noDataAvailable")}</p>;

  /* =========================
     EMPTY STATE - NO CONTENTS IN PERIOD
  ========================= */

  if (data.total_contents === 0 && data.total_all_time > 0) {
    const labels = {
      "7d": t("activity.last7days"),
      "30d": t("activity.last30days"),
      "90d": t("activity.last90days"),
    };

    return (
      <div className="dashboard-empty">
        <span className="dashboard-empty__badge">{t("activity.noActivity")}</span>
        <div className="dashboard-empty__icon">📅</div>
        <h2>{t("activity.noContentInPeriod", { period: labels[period].toLowerCase() })}</h2>
        <p>
          {t("activity.noContentInPeriodDesc")}
        </p>
        <div className="dashboard-empty__actions">
          <button className="btn-secondary" onClick={() => setPeriod("90d")}>
            {t("activity.viewLast90")}
          </button>
          <button className="btn-primary" onClick={() => navigate("/contents")}>
            {t("activity.goToContents")}
          </button>
        </div>
      </div>
    );
  }

  /* =========================
     EMPTY STATE
  ========================= */

  if (data.total_contents === 0) {
    return (
      <div className="dashboard-empty">
        <span className="dashboard-empty__badge">{t("activity.noDataYet")}</span>

        <div className="dashboard-empty__icon">📊</div>

        <h2>{t("activity.activityWillAppear")}</h2>

        <p>{t("activity.startByRegistering")}</p>

        <ul className="dashboard-empty__benefits">
          <li>{t("activity.trackProduction")}</li>
          <li>{t("activity.identifyPlatforms")}</li>
          <li>{t("activity.understandGrowth")}</li>
        </ul>

        <button
          className="btn-primary"
          onClick={() => navigate("/contents?create=true")}
        >
          {t("activity.createFirstContent")}
        </button>
      </div>
    );
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="dashboard">
      <div className="dashboard__performance">
        <div className="dashboard__performance-header">
          <div>
            <h2>{t("activity.performance")}</h2>
            <p>{t("activity.activityWithinPeriod")}</p>
          </div>

          <div className="dashboard__controls">
            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value as "7d" | "30d" | "90d")
              }
            >
              <option value="7d">{t("activity.last7days")}</option>
              <option value="30d">{t("activity.last30days")}</option>
              <option value="90d">{t("activity.last90days")}</option>
            </select>
          </div>
        </div>

        <KPISection data={data} growthVisual={growthVisual} />

        <DashboardChartsSection
          platformData={platformData}
          timelineData={timelineData}
          cumulativeData={cumulativeData}
        />
      </div>

      <DashboardConsistencySection heatmapData={heatmapData} />
    </div>
  );
}
