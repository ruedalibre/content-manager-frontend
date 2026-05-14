import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../supabaseClient";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import "./Admin.scss";

type ActiveUser = {
  id: string;
  email: string;
  created_at: string;
  total_contents: number;
  last_content_date: string | null;
};

type EarlyAccessRequest = {
  id: string;
  email: string;
  platform_name: string | null;
  creator_focus: string | null;
  language: string;
  priority: number;
  status: string;
  created_at: string;
  invited_at: string | null;
};

type UsersSummary = {
  total_users: number;
  users_with_content: number;
  total_contents: number;
  avg_contents_per_user: string;
};

type EcosystemData = {
  total_ideas: number;
  total_contents: number;
  total_briefs: number;
  avg_contents_per_idea: number;
  ideas_with_multiple_contents: number;
  pct_contents_with_topics: number;
  pct_contents_with_ideas: number;
  pct_idea_to_content: number;
  active_users_30d: number;
  top_topics: { name: string; total: number }[];
  total_brief_downloads: number;
  total_report_downloads: number;
  downloads_last_30d: number;
};

export default function Admin() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"operations" | "waitlist" | "ecosystem">("operations");

  const [usersSummary, setUsersSummary] = useState<UsersSummary | null>(null);

  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersFilter, setUsersFilter] = useState<"all" | "active" | "inactive">("all");
  const USERS_LIMIT = 10;


  const [platformUsage, setPlatformUsage] = useState<
    { platform_name: string; total_contents: number; percentage: string }[]
  >([]);

  const [ecosystem, setEcosystem] = useState<EcosystemData | null>(null);

  // Waitlist Intelligence — computed from allEarlyAccess (full dataset, no pagination)
  const [allEarlyAccess, setAllEarlyAccess] = useState<EarlyAccessRequest[]>([]);

  const [, setLoadingOps] = useState(true);
  const [loadingEco, setLoadingEco] = useState(false);

  const base = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

  useEffect(() => {
    const loadOperations = async () => {
      try {
        setLoadingOps(true);
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { Authorization: `Bearer ${session?.access_token}` };

        const [summaryRes, platformRes] = await Promise.all([
          fetch(`${base}/admin-users-summary`, { headers }),
          fetch(`${base}/admin-platform-usage`, { headers }),
        ]);

        if (summaryRes.ok) setUsersSummary(await summaryRes.json());
        if (platformRes.ok) setPlatformUsage(await platformRes.json());
      } catch (err) {
        console.error("Admin ops error:", err);
      } finally {
        setLoadingOps(false);
      }
    };
    loadOperations();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(
          `${base}/admin-users-list`,
          { headers: { Authorization: `Bearer ${session?.access_token}` } }
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const users = await res.json()

        let filtered = users
        if (usersFilter === "active") {
          filtered = users.filter((u: any) => u.total_contents > 0)
        } else if (usersFilter === "inactive") {
          filtered = users.filter((u: any) => u.total_contents === 0)
        }
        setActiveUsers(filtered)
      } catch (err) {
        console.error("Users load error:", err)
      }
    };
    loadUsers();
  }, [usersFilter]);

  useEffect(() => {
    if (activeTab !== "waitlist" || allEarlyAccess.length > 0) return;
    const loadAll = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${base}/admin-early-access?page=1&limit=500`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        setAllEarlyAccess(json.data ?? []);
      } catch (err) {
        console.error("Waitlist analytics load error:", err);
      }
    };
    loadAll();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "ecosystem" || ecosystem) return;
    const loadEcosystem = async () => {
      try {
        setLoadingEco(true);
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${base}/admin-ecosystem`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.ok) setEcosystem(await res.json());
      } catch (err) {
        console.error("Ecosystem error:", err);
      } finally {
        setLoadingEco(false);
      }
    };
    loadEcosystem();
  }, [activeTab]);

  // ── Waitlist analytics helpers ──
  function countBy<T>(arr: T[], key: keyof T): Record<string, number> {
    return arr.reduce((acc, item) => {
      const val = String(item[key] ?? "Unknown");
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  function groupByWeek(records: EarlyAccessRequest[]): { week: string; count: number; cumulative: number }[] {
    const weeks: Record<string, number> = {};
    records.forEach((r) => {
      const d = new Date(r.created_at);
      const mon = new Date(d);
      mon.setDate(d.getDate() - d.getDay() + 1);
      const key = mon.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    });
    const sorted = Object.entries(weeks).sort((a, b) => a[0].localeCompare(b[0]));
    let cum = 0;
    return sorted.map(([week, count]) => { cum += count; return { week, count, cumulative: cum }; });
  }

  return (
    <div className="admin-page">

      <div className="admin-header">
        <div>
          <h2>{t("admin.title")}</h2>
          <p>{t("admin.subtitle")}</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          key="operations"
          className={`admin-tab ${activeTab === "operations" ? "admin-tab--active" : ""}`}
          onClick={() => setActiveTab("operations")}
          type="button"
        >
          {t("admin.operations")}
        </button>
        <button
          key="waitlist"
          className={`admin-tab ${activeTab === "waitlist" ? "admin-tab--active" : ""}`}
          onClick={() => setActiveTab("waitlist")}
          type="button"
        >
          {t("admin.waitlistIntelligence")}
        </button>
        <button
          key="ecosystem"
          className={`admin-tab ${activeTab === "ecosystem" ? "admin-tab--active" : ""}`}
          onClick={() => setActiveTab("ecosystem")}
          type="button"
        >
          {t("admin.ecosystem")}
        </button>
      </div>

      {/* OPERATIONS TAB */}
      {activeTab === "operations" && (
        <div className="admin-tab-content">

          {usersSummary && (
            <section className="admin-section">
              <span className="section-label">{t("admin.platformOverview")}</span>
              <div className="admin-stats">
                <div className="admin-card stat-card">
                  <div className="stat-value">{usersSummary.total_users}</div>
                  <div className="stat-label">{t("admin.totalUsers")}</div>
                </div>
                <div className="admin-card stat-card">
                  <div className="stat-value">{usersSummary.users_with_content}</div>
                  <div className="stat-label">{t("admin.withContent")}</div>
                </div>
                <div className="admin-card stat-card">
                  <div className="stat-value">{usersSummary.total_contents}</div>
                  <div className="stat-label">{t("admin.totalContents")}</div>
                </div>
                <div className="admin-card stat-card">
                  <div className="stat-value">{usersSummary.avg_contents_per_user}</div>
                  <div className="stat-label">{t("admin.avgPerUser")}</div>
                </div>
              </div>
            </section>
          )}

          <section className="admin-section">
            <div className="admin-section__header">
              <span className="section-label">{t("admin.activeUsers")}</span>
              <select
                className="admin-filter"
                value={usersFilter}
                onChange={(e) =>
                  setUsersFilter(e.target.value as "all" | "active" | "inactive")
                }
              >
                <option value="all">All</option>
                <option value="active">With content</option>
                <option value="inactive">No content</option>
              </select>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("admin.email")}</th>
                    <th>{t("admin.totalContents")}</th>
                    <th>{t("admin.registered")}</th>
                    <th>{t("admin.lastContent")}</th>
                    <th>{t("admin.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUsers
                    .slice((usersPage - 1) * USERS_LIMIT, usersPage * USERS_LIMIT)
                    .map((user) => (
                      <tr key={user.id}>
                        <td>{user.email}</td>
                        <td><strong>{user.total_contents}</strong></td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          {user.last_content_date
                            ? new Date(user.last_content_date).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          <span
                            className={`admin-badge ${
                              user.total_contents > 0
                                ? "admin-badge--active"
                                : "admin-badge--inactive"
                            }`}
                          >
                            {user.total_contents > 0 ? t("admin.active") : t("admin.inactive")}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {activeUsers.length > USERS_LIMIT && (
              <div className="admin-pagination">
                <button
                  disabled={usersPage === 1}
                  onClick={() => setUsersPage((p) => p - 1)}
                  type="button"
                >
                  ‹
                </button>
                <span>
                  {usersPage} of {Math.ceil(activeUsers.length / USERS_LIMIT)}
                </span>
                <button
                  disabled={usersPage >= Math.ceil(activeUsers.length / USERS_LIMIT)}
                  onClick={() => setUsersPage((p) => p + 1)}
                  type="button"
                >
                  ›
                </button>
              </div>
            )}
          </section>

          {platformUsage.length > 0 && (
            <section className="admin-section">
              <span className="section-label">{t("admin.platformDistribution")}</span>
              <div className="admin-card">
                {platformUsage.map((p) => (
                  <div key={p.platform_name} className="admin-bar-row">
                    <span className="admin-bar-label">{p.platform_name}</span>
                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill"
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                    <span className="admin-bar-pct">{p.percentage}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}

      {/* WAITLIST INTELLIGENCE TAB */}
      {activeTab === "waitlist" && (
        <div className="admin-tab-content">
          {allEarlyAccess.length === 0 ? (
            <p>{t("admin.loading")}</p>
          ) : (() => {
            const records = allEarlyAccess;
            const total = records.length;
            const invited = records.filter(r => r.status === "invited").length;
            const weeklyData = groupByWeek(records);
            const platformCounts = countBy(records, "platform_name");
            const sortedPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
            const maxPlatform = sortedPlatforms[0]?.[1] ?? 1;

            return (
              <>
                {/* 1 — KPIs */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.waitlistOverview")}</span>
                  <div className="admin-stats">
                    <div className="admin-card stat-card">
                      <div className="stat-value admin-highlight">{total}</div>
                      <div className="stat-label">{t("admin.totalRegistered")}</div>
                    </div>
                    <div className="admin-card stat-card">
                      <div className="stat-value admin-highlight">{invited}</div>
                      <div className="stat-label">{t("admin.invited")}</div>
                    </div>
                    <div className="admin-card stat-card">
                      <div className="stat-value admin-highlight">
                        {total > 0 ? Math.round((invited / total) * 100) : 0}%
                      </div>
                      <div className="stat-label">{t("admin.inviteRate")}</div>
                    </div>
                    <div className="admin-card stat-card">
                      <div className="stat-value admin-highlight">{weeklyData.length}</div>
                      <div className="stat-label">{t("admin.weeksActive")}</div>
                    </div>
                  </div>
                </section>

                {/* 2 — Crecimiento acumulado (AreaChart) */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.weeklyGrowth")}</span>
                  <div className="admin-card admin-card--chart">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart
                        data={weeklyData}
                        margin={{ top: 8, right: 16, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="gradCumulative" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradWeekly" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border-subtle)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 11, fill: "var(--text-faint)", fontFamily: "var(--font-mono)" }}
                          tickFormatter={(val: string) => {
                            const d = new Date(val);
                            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "var(--text-faint)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-3)",
                            fontSize: 12,
                            color: "var(--text)",
                            boxShadow: "var(--shadow-md)",
                          }}
                          labelFormatter={(val) => {
                            const d = new Date(String(val));
                            return `Week of ${d.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
                          }}
                          formatter={(value, name) => [
                            value ?? 0,
                            name === "cumulative"
                              ? t("admin.totalAccumulated")
                              : t("admin.newThisWeek"),
                          ] as [number, string]}
                        />
                        <Area
                          type="monotone"
                          dataKey="cumulative"
                          stroke="var(--primary)"
                          strokeWidth={2}
                          fill="url(#gradCumulative)"
                          dot={false}
                          activeDot={{ r: 4, fill: "var(--primary)" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="var(--accent)"
                          strokeWidth={1.5}
                          fill="url(#gradWeekly)"
                          dot={false}
                          activeDot={{ r: 3, fill: "var(--accent)" }}
                          strokeDasharray="4 2"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="admin-chart-legend">
                      <span className="admin-chart-legend__item admin-chart-legend__item--primary">
                        {t("admin.totalAccumulated")}
                      </span>
                      <span className="admin-chart-legend__item admin-chart-legend__item--accent">
                        {t("admin.newThisWeek")}
                      </span>
                    </div>
                  </div>
                </section>

                {/* 3 — Distribución por plataforma */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.platformBreakdown")}</span>
                  <div className="admin-card">
                    {sortedPlatforms.map(([name, count]) => (
                      <div key={name} className="admin-bar-row">
                        <span className="admin-bar-label">{name}</span>
                        <div className="admin-bar-track">
                          <div
                            className="admin-bar-fill"
                            style={{ width: `${Math.round((count / maxPlatform) * 100)}%` }}
                          />
                        </div>
                        <span className="admin-bar-pct">{count}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4 — Distribución por idioma (donut) */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.languageDistribution")}</span>
                  <div className="admin-card admin-card--chart">
                    {(() => {
                      const langCounts = allEarlyAccess.reduce((acc, r) => {
                        const lang = r.language?.toLowerCase() === "es" ? "Español" : "English";
                        acc[lang] = (acc[lang] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      const pieData = Object.entries(langCounts).map(([name, value]) => ({ name, value }));
                      const COLORS = ["var(--primary)", "var(--accent)"];
                      const total = allEarlyAccess.length;

                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-7)" }}>
                          <ResponsiveContainer width={200} height={200}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={54}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieData.map((_, index) => (
                                  <Cell
                                    key={index}
                                    fill={COLORS[index % COLORS.length]}
                                    stroke="var(--bg-elevated)"
                                    strokeWidth={2}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  background: "var(--bg-elevated)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "var(--r-3)",
                                  fontSize: 12,
                                  color: "var(--text)",
                                  boxShadow: "var(--shadow-md)",
                                }}
                                formatter={(value, name) => [
                                  `${value} (${Math.round(((value as number) / total) * 100)}%)`,
                                  name,
                                ] as [string, string]}
                              />
                            </PieChart>
                          </ResponsiveContainer>

                          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
                            {pieData.map((entry, index) => (
                              <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                                <div style={{
                                  width: 10, height: 10, borderRadius: "50%",
                                  background: COLORS[index % COLORS.length],
                                  flexShrink: 0,
                                }} />
                                <span style={{ fontSize: "var(--fs-13)", color: "var(--text-secondary)", minWidth: 80 }}>
                                  {entry.name}
                                </span>
                                <span style={{ fontSize: "var(--fs-20)", fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-display)", lineHeight: 1 }}>
                                  {entry.value}
                                </span>
                                <span style={{ fontSize: "var(--fs-12)", color: "var(--text-faint)" }}>
                                  {Math.round((entry.value / total) * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </section>

                {/* 5 — Lista de espera completa (solo lectura) */}
                <section className="admin-section">
                  <span className="section-label">
                    {t("admin.earlyAccessWaitlist")} ({allEarlyAccess.length})
                  </span>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{t("admin.email")}</th>
                          <th>{t("admin.platform")}</th>
                          <th>{t("admin.focus")}</th>
                          <th>{t("admin.status")}</th>
                          <th>{t("admin.lang")}</th>
                          <th>{t("admin.requested")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allEarlyAccess.map((r) => (
                          <tr key={r.id}>
                            <td>{r.email}</td>
                            <td>{r.platform_name ?? "—"}</td>
                            <td style={{ color: "var(--text-muted)" }}>{r.creator_focus ?? "—"}</td>
                            <td>
                              <span className={`admin-badge ${
                                r.status === "invited" ? "admin-badge--invited" : "admin-badge--pending"
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td>
                              <span className={`admin-badge ${
                                r.language?.toLowerCase() === "es"
                                  ? "admin-badge--invited"
                                  : "admin-badge--pending"
                              }`}>
                                {r.language?.toUpperCase() ?? "—"}
                              </span>
                            </td>
                            <td>{new Date(r.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            );
          })()}
        </div>
      )}

      {/* ECOSYSTEM TAB */}
      {activeTab === "ecosystem" && (
        <div className="admin-tab-content">
          {loadingEco ? (
            <p>{t("admin.loadingEcosystem")}</p>
          ) : ecosystem ? (
            <>
              <section className="admin-section">
                <span className="section-label">{t("admin.systemInNumbers")}</span>
                <div className="admin-stats">
                  <div className="admin-card stat-card">
                    <div className="stat-value admin-highlight">
                      {ecosystem.total_ideas}
                    </div>
                    <div className="stat-label">{t("admin.ideasCreated")}</div>
                  </div>
                  <div className="admin-card stat-card">
                    <div className="stat-value admin-highlight">
                      {ecosystem.total_contents}
                    </div>
                    <div className="stat-label">{t("admin.contentsRegistered")}</div>
                  </div>
                  <div className="admin-card stat-card">
                    <div className="stat-value admin-highlight">
                      {ecosystem.total_briefs}
                    </div>
                    <div className="stat-label">{t("admin.briefsGenerated")}</div>
                  </div>
                  <div className="admin-card stat-card">
                    <div className="stat-value admin-highlight">
                      {ecosystem.avg_contents_per_idea}
                    </div>
                    <div className="stat-label">{t("admin.contentsPerIdea")}</div>
                    <div className="stat-delta">{t("admin.coreMetric")}</div>
                  </div>
                  <div className="admin-card stat-card">
                    <div className="stat-value admin-highlight">
                      {ecosystem.total_brief_downloads}
                    </div>
                    <div className="stat-label">{t("admin.briefsDownloaded")}</div>
                  </div>
                  <div className="admin-card stat-card">
                    <div className="stat-value admin-highlight">
                      {ecosystem.total_report_downloads}
                    </div>
                    <div className="stat-label">{t("admin.reportsDownloaded")}</div>
                  </div>
                  <div className="admin-card stat-card">
                    <div className="stat-value admin-highlight">
                      {ecosystem.downloads_last_30d}
                    </div>
                    <div className="stat-label">{t("admin.downloads30d")}</div>
                  </div>
                </div>
              </section>

              <section className="admin-section">
                <div className="admin-two-col">
                  <div>
                    <span className="section-label">{t("admin.creativeProcessHealth")}</span>
                    <div className="admin-card admin-metrics">
                      {[
                        {
                          label: t("admin.ideaToContentConversion"),
                          value: `${ecosystem.pct_idea_to_content}%`,
                        },
                        {
                          label: t("admin.ideasWithMultipleContents"),
                          value: ecosystem.ideas_with_multiple_contents,
                        },
                        {
                          label: t("admin.contentsWithTopics"),
                          value: `${ecosystem.pct_contents_with_topics}%`,
                        },
                        {
                          label: t("admin.contentsWithIdeas"),
                          value: `${ecosystem.pct_contents_with_ideas}%`,
                        },
                        {
                          label: t("admin.activeUsers30d"),
                          value: ecosystem.active_users_30d,
                        },
                      ].map((m) => (
                        <div key={m.label} className="admin-metric-row">
                          <span className="admin-metric-label">{m.label}</span>
                          <span className="admin-metric-value">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="section-label">{t("admin.topTopicsOnPlatform")}</span>
                    <div className="admin-card">
                      {ecosystem.top_topics.map((t) => {
                        const max = ecosystem.top_topics[0]?.total ?? 1;
                        const pct = Math.round((t.total / max) * 100);
                        return (
                          <div key={t.name} className="admin-bar-row">
                            <span className="admin-bar-label">{t.name}</span>
                            <div className="admin-bar-track">
                              <div
                                className="admin-bar-fill"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="admin-bar-pct">{t.total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <p>{t("admin.noEcosystemData")}</p>
          )}
        </div>
      )}

    </div>
  );
}
