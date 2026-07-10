import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, BarChart3 } from "lucide-react";
import { useDashboardData } from "../../features/dashboard/hooks/useDashboardData.ts";
import ProfileNudge from "../../components/ui/ProfileNudge.tsx";

import KPISection from "../../features/dashboard/components/KPISection.tsx";
import DashboardChartsSection from "../../features/dashboard/components/DashboardChartsSection.tsx";
import DashboardConsistencySection from "../../features/dashboard/components/DashboardConsistencySection.tsx";

import { getGrowthVisual } from "../../utils/growthRate.ts";

import { useOutletContext, useNavigate } from "react-router-dom";
import { useWorkspace } from "../../features/workspace/hooks/useWorkspace.tsx";

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
  const [checkoutStatus, setCheckoutStatus] = useState<
    "success" | "cancelled" | null
  >(null);
  const { currentWorkspaceId } = useWorkspace();

  const {
    data,
    platformData,
    timelineData,
    cumulativeData,
    growthRateData,
    heatmapData,
    loading,
  } = useDashboardData(period, currentWorkspaceId);

  const growthVisual = getGrowthVisual(growthRateData);

  const { t } = useTranslation();
  const { setTopbarContext } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  /* =========================
     CHECKOUT RETURN
  ========================= */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    if (status === "success" || status === "cancelled") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheckoutStatus(status as "success" | "cancelled");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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
        <span className="dashboard-empty__badge">
          {t("activity.noActivity")}
        </span>
        <div className="dashboard-empty__icon">
          <Calendar size={42} strokeWidth={1.5} />
        </div>
        <h2>
          {t("activity.noContentInPeriod", {
            period: labels[period].toLowerCase(),
          })}
        </h2>
        <p>{t("activity.noContentInPeriodDesc")}</p>
        <div className="dashboard-empty__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setPeriod("90d")}
          >
            {t("activity.viewLast90")}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate("/contents")}
          >
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
        <span className="dashboard-empty__badge">
          {t("activity.noDataYet")}
        </span>

        <div className="dashboard-empty__icon">
          <BarChart3 size={42} strokeWidth={1.5} />
        </div>

        <h2>{t("activity.activityWillAppear")}</h2>

        <p>{t("activity.startByRegistering")}</p>

        <ul className="dashboard-empty__benefits">
          <li>{t("activity.trackProduction")}</li>
          <li>{t("activity.identifyPlatforms")}</li>
          <li>{t("activity.understandGrowth")}</li>
        </ul>

        <button
          type="button"
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
      <ProfileNudge />

      <div className="dashboard__performance">
        <div
          className="dashboard__controls"
          style={{ display: "flex", justifyContent: "flex-end" }}
        >
          <select
            className="admin-filter"
            value={period}
            onChange={(e) => setPeriod(e.target.value as "7d" | "30d" | "90d")}
          >
            <option value="7d">{t("activity.last7days")}</option>
            <option value="30d">{t("activity.last30days")}</option>
            <option value="90d">{t("activity.last90days")}</option>
          </select>
        </div>

        {checkoutStatus === "success" && (
          <div
            style={{
              padding: "12px 16px",
              background: "var(--success-soft)",
              border: "1px solid rgba(74,138,110,0.2)",
              borderRadius: "var(--r-3)",
              fontSize: "var(--fs-13)",
              color: "var(--success)",
              marginBottom: "var(--s-4)",
            }}
          >
            🎉 {t("checkout.successMessage")}
          </div>
        )}
        {checkoutStatus === "cancelled" && (
          <div
            style={{
              padding: "12px 16px",
              background: "var(--bg-muted)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-3)",
              fontSize: "var(--fs-13)",
              color: "var(--text-secondary)",
              marginBottom: "var(--s-4)",
            }}
          >
            {t("checkout.cancelledMessage")}
          </div>
        )}

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
