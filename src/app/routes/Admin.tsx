import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../supabaseClient";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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

type SurveyRow = {
  language: string | null;
  platform: string | null;
  frequency: string | null;
  content_type: string | null;
  content_educational: string | null;
  content_reviews: string | null;
  content_personal: string | null;
  content_tutorials: string | null;
  content_entertainment: string | null;
  content_mixed: string | null;
  ideas_random: string | null;
  ideas_notes: string | null;
  ideas_trends: string | null;
  ideas_audience: string | null;
  ideas_ai: string | null;
  ideas_system: string | null;
  keeps_ideas: string | null;
  reuses_ideas: string | null;
  creates_series: string | null;
  most_difficult: string | null;
  knows_what_works_analytics: string | null;
  knows_what_works_intuition: string | null;
  knows_what_works_audience: string | null;
  knows_what_works_unsure: string | null;
  most_valuable: string | null;
  workflow_wish: string | null;
  wants_early_access: string | null;
  submitted_at: string | null;
};

type ProfileStats = {
  total_profiles: number;
  complete_profiles: number;
  with_display_name: number;
  with_country: number;
  with_timezone: number;
  with_creator_role: number;
  with_time_availability: number;
  with_production_setup: number;
  language_dist: { name: string; value: number }[];
  setup_dist: { name: string; value: number }[];
  time_availability_dist: { name: string; value: number }[];
  creator_role_dist: { name: string; value: number }[];
  country_dist: { name: string; value: number }[];
};

// ── Shared donut chart for waitlist analytics ──
type DonutEntry = { name: string; value: number };
function WaitlistDonut({
  data,
  colors,
  total,
}: {
  data: DonutEntry[];
  colors: string[];
  total: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s-6)" }}>
      <div style={{ flexShrink: 0 }}>
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={76}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={colors[i % colors.length]}
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
                `${value} · ${Math.round(((value as number) / total) * 100)}%`,
                name,
              ] as [string, string]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {data.map((entry, i) => (
          <div
            key={entry.name}
            style={{
              display: "grid",
              gridTemplateColumns: "8px auto 1fr auto",
              alignItems: "center",
              gap: "var(--s-2) var(--s-3)",
              marginBottom: "var(--s-2)",
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: colors[i % colors.length],
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: "var(--fs-12)",
              color: "var(--text-secondary)",
              lineHeight: 1.3,
              wordBreak: "break-word",
              whiteSpace: "normal",
              overflow: "visible",
              textOverflow: "unset",
            }}>
              {entry.name}
            </span>
            <span style={{
              fontSize: "var(--fs-13)",
              fontWeight: 600,
              color: "var(--text)",
              fontFamily: "var(--font-display)",
              textAlign: "right",
            }}>
              {entry.value}
            </span>
            <span style={{
              fontSize: "var(--fs-11)",
              color: "var(--text-faint)",
              textAlign: "right",
              fontFamily: "var(--font-mono)",
              whiteSpace: "nowrap",
            }}>
              {Math.round((entry.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const { t } = useTranslation();
  const { isAdmin } = useOutletContext<{ setTopbarContext: (ctx: string | null) => void; isAdmin: boolean }>();
  const [activeTab, setActiveTab] = useState<"operations" | "ecosystem" | "waitlist" | "survey" | "profiles">("operations");

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

  // Early Access — Operations tab (paginated, filterable, with invite action)
  const [earlyAccess, setEarlyAccess] = useState<EarlyAccessRequest[]>([]);
  const [earlyTotal, setEarlyTotal] = useState(0);
  const [earlyPage, setEarlyPage] = useState(1);
  const [earlyStatusFilter, setEarlyStatusFilter] = useState("all");
  const [earlyLangFilter, setEarlyLangFilter] = useState("all");
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const EARLY_LIMIT = 10;

  const [surveyData, setSurveyData] = useState<SurveyRow[]>([]);
  const [surveyOpenPage, setSurveyOpenPage] = useState(1);
  const SURVEY_OPEN_LIMIT = 5;

  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const [, setLoadingOps] = useState(true);
  const [loadingEco, setLoadingEco] = useState(false);

  const base = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

  const PLATFORM_COLORS = [
    "var(--primary)",
    "var(--pastel-accent-d)",
    "var(--accent)",
    "var(--pastel-primary)",
    "var(--pastel-accent)",
    "var(--pastel-text)",
    "var(--pastel-border)",
  ];

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
    const loadEarlyAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const params = new URLSearchParams({
          page: String(earlyPage),
          limit: String(EARLY_LIMIT),
        });
        if (earlyStatusFilter !== "all") params.set("status", earlyStatusFilter);
        if (earlyLangFilter !== "all") params.set("language", earlyLangFilter);
        const res = await fetch(`${base}/admin-early-access?${params}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        setEarlyAccess(json.data ?? []);
        setEarlyTotal(json.total ?? 0);
      } catch (err) {
        console.error("Early access load error:", err);
      }
    };
    loadEarlyAccess();
  }, [earlyPage, earlyStatusFilter, earlyLangFilter]);

  const handleInvite = async (r: EarlyAccessRequest) => {
    setInvitingId(r.id);
    setInviteError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${base}/admin-invite-user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ request_id: r.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        setInviteError(err.error ?? "Error sending invite");
      } else {
        setEarlyAccess((prev) =>
          prev.map((item) =>
            item.id === r.id
              ? { ...item, status: "invited", invited_at: new Date().toISOString() }
              : item
          )
        );
      }
    } catch (err) {
      setInviteError(String(err));
    } finally {
      setInvitingId(null);
    }
  };

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

  useEffect(() => {
    if (activeTab !== "survey" || surveyData.length > 0) return;
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${base}/admin-survey-responses`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (!res.ok) return;
        setSurveyData(await res.json());
      } catch (err) {
        console.error("Survey load error:", err);
      }
    };
    load();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "profiles" || profileStats) return;
    const load = async () => {
      try {
        setLoadingProfiles(true);
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${base}/admin-profile-stats`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.ok) setProfileStats(await res.json());
      } catch (err) {
        console.error("Profiles stats error:", err);
      } finally {
        setLoadingProfiles(false);
      }
    };
    load();
  }, [activeTab]);

  // ── Analytics helpers ──

  // Diccionario maestro EN → ES (un solo lugar para mantener)
  const EN_TO_ES: Record<string, string> = {
    // frequency
    "Every day":                                    "A diario",
    "Once a week":                                  "Una vez a la semana",
    "A few times a month":                          "Unas cuantas veces al mes",
    "Occasionally":                                 "De vez en cuando",
    // reuses_ideas / creates_series
    "Often":                                        "A menudo",
    "Sometimes":                                    "A veces",
    "Rarely":                                       "Rara vez",
    "Never":                                        "Nunca",
    "Yes, often":                                   "Sí, con frecuencia",
    // keeps_ideas
    "No, I usually keep ideas in my head":          "No, suelo guardar las ideas en mi cabeza",
    "Yes, in a notes app":                          "Sí, en una aplicación de notas",
    "Yes, in a productivity tool (Notion, etc.)":   "Sí, en una herramienta de productividad (Notion, etc.)",
    "Yes, in spreadsheets":                         "Sí, en hojas de cálculo",
    // most_difficult
    "Find ideas":                                   "Encontrar ideas",
    "Organize your content":                        "Organizar el contenido",
    "Maintain consistency":                         "Mantener la coherencia",
    "Decide what to post next":                     "Decidir qué publicar a continuación",
    "Understand what works":                        "Entender qué funciona",
    // most_valuable
    "Turn ideas into content series":               "Convertir ideas en series de contenido",
    "Discover new content ideas":                   "Descubrir nuevas ideas de contenido",
    "Identify patterns in my content":              "Identificar patrones en mi contenido",
    "Understand what works best":                   "Entender qué es lo que mejor funciona",
    "Organize my ideas":                            "Organizar mis ideas",
    // wants_early_access
    "Yes":                                          "Sí",
    "Maybe":                                        "Quizás",
    "Not right now":                                "Ahora mismo no",
  };

  function normalizeSurveyRow(r: SurveyRow): SurveyRow {
    const n = (val: string | null) => (val ? (EN_TO_ES[val] ?? val) : val);
    return {
      ...r,
      frequency:          n(r.frequency),
      reuses_ideas:       n(r.reuses_ideas),
      creates_series:     n(r.creates_series),
      keeps_ideas:        n(r.keeps_ideas),
      most_difficult:     n(r.most_difficult),
      most_valuable:      n(r.most_valuable),
      wants_early_access: n(r.wants_early_access),
    };
  }

  function countTrue(arr: SurveyRow[], key: keyof SurveyRow): number {
    return arr.filter(r => r[key] === "TRUE").length;
  }

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
          key="ecosystem"
          className={`admin-tab ${activeTab === "ecosystem" ? "admin-tab--active" : ""}`}
          onClick={() => setActiveTab("ecosystem")}
          type="button"
        >
          {t("admin.ecosystem")}
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
          key="survey"
          className={`admin-tab ${activeTab === "survey" ? "admin-tab--active" : ""}`}
          onClick={() => setActiveTab("survey")}
          type="button"
        >
          {t("admin.surveyTab")}
        </button>
        {isAdmin && (
          <button
            key="profiles"
            className={`admin-tab ${activeTab === "profiles" ? "admin-tab--active" : ""}`}
            onClick={() => setActiveTab("profiles")}
            type="button"
          >
            {t("admin.profilesTab")}
          </button>
        )}
      </div>

      {/* OPERATIONS TAB */}
      {activeTab === "operations" && (
        <div className="admin-tab-content">

          {/* 1 — KPIs */}
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

          {/* 2 — Donuts: user status + platform distribution */}
          <div className="admin-two-col">

            {/* Donut — User status */}
            {usersSummary && (() => {
              const inactive = usersSummary.total_users - usersSummary.users_with_content;
              const statusData = [
                { name: t("admin.active"), value: usersSummary.users_with_content },
                { name: t("admin.inactive"), value: inactive },
              ];
              return (
                <section className="admin-section">
                  <span className="section-label">{t("admin.userStatus")}</span>
                  <div className="admin-card admin-card--chart">
                    <WaitlistDonut
                      data={statusData}
                      colors={["var(--accent)", "var(--bg-muted)"]}
                      total={usersSummary.total_users}
                    />
                  </div>
                </section>
              );
            })()}

            {/* Donut — Platform distribution */}
            {platformUsage.length > 0 && (() => {
              const platformData = platformUsage.map(p => ({
                name: p.platform_name,
                value: p.total_contents,
              }));
              const platformTotal = platformData.reduce((s, p) => s + p.value, 0);
              return (
                <section className="admin-section">
                  <span className="section-label">{t("admin.platformDistribution")}</span>
                  <div className="admin-card admin-card--chart">
                    <WaitlistDonut
                      data={platformData}
                      colors={PLATFORM_COLORS}
                      total={platformTotal}
                    />
                  </div>
                </section>
              );
            })()}

          </div>

          {/* 3 — Active users table (moved to bottom) */}
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
            const platformPieData = sortedPlatforms.map(([name, value]) => ({ name, value }));

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

                {/* 3+4 — Distribución por idioma y plataforma (donuts lado a lado) */}
                {(() => {
                  const langCounts = allEarlyAccess.reduce((acc, r) => {
                    const lang = r.language?.toLowerCase() === "es" ? "Español" : "English";
                    acc[lang] = (acc[lang] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  const pieData = Object.entries(langCounts).map(([name, value]) => ({ name, value }));

                  return (
                    <div className="admin-two-col">
                      <section className="admin-section">
                        <span className="section-label">{t("admin.languageDistribution")}</span>
                        <div className="admin-card admin-card--chart">
                          <WaitlistDonut
                            data={pieData}
                            colors={["var(--primary)", "var(--accent)"]}
                            total={total}
                          />
                        </div>
                      </section>
                      <section className="admin-section">
                        <span className="section-label">{t("admin.platformBreakdown")}</span>
                        <div className="admin-card admin-card--chart">
                          <WaitlistDonut
                            data={platformPieData}
                            colors={PLATFORM_COLORS}
                            total={total}
                          />
                        </div>
                      </section>
                    </div>
                  );
                })()}

                {/* 5 — Lista de espera con acción de invitación */}
                <section className="admin-section">
                  <div className="admin-section__header">
                    <span className="section-label">{t("admin.earlyAccessWaitlist")}</span>
                    <div className="admin-filters">
                      <select
                        className="admin-filter"
                        value={earlyStatusFilter}
                        onChange={(e) => { setEarlyStatusFilter(e.target.value); setEarlyPage(1); }}
                      >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="invited">Invited</option>
                      </select>
                      <select
                        className="admin-filter"
                        value={earlyLangFilter}
                        onChange={(e) => { setEarlyLangFilter(e.target.value); setEarlyPage(1); }}
                      >
                        <option value="all">All languages</option>
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>{t("admin.email")}</th>
                          <th>{t("admin.platform")}</th>
                          <th>{t("admin.focus")}</th>
                          <th>{t("admin.status")}</th>
                          <th>{t("admin.lang")}</th>
                          <th>{t("admin.registered")}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {earlyAccess.map((r) => (
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
                            <td>
                              {r.status === "pending" && (
                                <>
                                  <button
                                    className="admin-invite-btn"
                                    onClick={() => handleInvite(r)}
                                    disabled={invitingId === r.id}
                                    type="button"
                                  >
                                    {invitingId === r.id ? t("admin.sending") : t("admin.invite")}
                                  </button>
                                  {inviteError && invitingId === null && (
                                    <p className="admin-error">{inviteError}</p>
                                  )}
                                </>
                              )}
                              {r.status === "invited" && (
                                <span className="admin-invited-date">
                                  {r.invited_at
                                    ? new Date(r.invited_at).toLocaleDateString()
                                    : "—"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {earlyTotal > EARLY_LIMIT && (
                    <div className="admin-pagination">
                      <button
                        disabled={earlyPage === 1}
                        onClick={() => setEarlyPage((p) => p - 1)}
                        type="button"
                      >‹</button>
                      <span>{earlyPage} of {Math.ceil(earlyTotal / EARLY_LIMIT)}</span>
                      <button
                        disabled={earlyPage >= Math.ceil(earlyTotal / EARLY_LIMIT)}
                        onClick={() => setEarlyPage((p) => p + 1)}
                        type="button"
                      >›</button>
                    </div>
                  )}
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

      {/* PROFILES TAB */}
      {activeTab === "profiles" && (
        <div className="admin-tab-content">
          {loadingProfiles ? (
            <p>{t("admin.loadingProfiles")}</p>
          ) : !profileStats || !profileStats.language_dist ? (
            <p>{t("admin.loading")}</p>
          ) : (() => {
            const total = profileStats.total_profiles;
            const completionRate = total > 0
              ? Math.round((profileStats.complete_profiles / total) * 100)
              : 0;

            const fields = [
              { label: t("admin.profileFieldDisplayName"), count: profileStats.with_display_name },
              { label: t("admin.profileFieldRole"),        count: profileStats.with_creator_role },
              { label: t("admin.profileFieldCountry"),     count: profileStats.with_country },
              { label: t("admin.profileFieldTimezone"),    count: profileStats.with_timezone },
              { label: t("admin.profileFieldTimeAvail"),   count: profileStats.with_time_availability },
              { label: t("admin.profileFieldSetup"),       count: profileStats.with_production_setup },
            ].sort((a, b) => b.count - a.count);

            return (
              <>
                {/* KPIs */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.profilesOverview")}</span>
                  <div className="admin-stats">
                    <div className="admin-card stat-card">
                      <div className="stat-value admin-highlight">{total}</div>
                      <div className="stat-label">{t("admin.totalProfiles")}</div>
                    </div>
                    <div className="admin-card stat-card">
                      <div className="stat-value admin-highlight">{profileStats.complete_profiles}</div>
                      <div className="stat-label">{t("admin.completeProfiles")}</div>
                    </div>
                    <div className="admin-card stat-card">
                      <div className="stat-value admin-highlight">{completionRate}%</div>
                      <div className="stat-label">{t("admin.profileCompletionRate")}</div>
                    </div>
                  </div>
                </section>

                {/* Field completeness bars */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.profileFieldCompleteness")}</span>
                  <div className="admin-card">
                    {fields.map(f => (
                      <div key={f.label} className="admin-bar-row">
                        <span className="admin-bar-label">{f.label}</span>
                        <div className="admin-bar-track">
                          <div
                            className="admin-bar-fill"
                            style={{ width: total > 0 ? `${Math.round((f.count / total) * 100)}%` : "0%" }}
                          />
                        </div>
                        <span className="admin-bar-pct">
                          {f.count} · {total > 0 ? Math.round((f.count / total) * 100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Language + Production setup donuts */}
                {(profileStats.language_dist.length > 0 || profileStats.setup_dist.length > 0) && (
                  <div className="admin-two-col">
                    {profileStats.language_dist.length > 0 && (
                      <section className="admin-section">
                        <span className="section-label">{t("admin.profileLanguageDist")}</span>
                        <div className="admin-card admin-card--chart">
                          <WaitlistDonut
                            data={profileStats.language_dist}
                            colors={["var(--primary)", "var(--accent)"]}
                            total={profileStats.language_dist.reduce((s, d) => s + d.value, 0)}
                          />
                        </div>
                      </section>
                    )}
                    {profileStats.setup_dist.length > 0 && (
                      <section className="admin-section">
                        <span className="section-label">{t("admin.profileSetupDist")}</span>
                        <div className="admin-card admin-card--chart">
                          <WaitlistDonut
                            data={profileStats.setup_dist}
                            colors={PLATFORM_COLORS}
                            total={profileStats.setup_dist.reduce((s, d) => s + d.value, 0)}
                          />
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {/* Time availability + Creator role donuts */}
                {(profileStats.time_availability_dist.length > 0 || profileStats.creator_role_dist.length > 0) && (
                  <div className="admin-two-col">
                    {profileStats.time_availability_dist.length > 0 && (
                      <section className="admin-section">
                        <span className="section-label">{t("admin.profileTimeDist")}</span>
                        <div className="admin-card admin-card--chart">
                          <WaitlistDonut
                            data={profileStats.time_availability_dist}
                            colors={PLATFORM_COLORS}
                            total={profileStats.time_availability_dist.reduce((s, d) => s + d.value, 0)}
                          />
                        </div>
                      </section>
                    )}
                    {profileStats.creator_role_dist.length > 0 && (
                      <section className="admin-section">
                        <span className="section-label">{t("admin.profileRoleDist")}</span>
                        <div className="admin-card admin-card--chart">
                          <WaitlistDonut
                            data={profileStats.creator_role_dist}
                            colors={PLATFORM_COLORS}
                            total={profileStats.creator_role_dist.reduce((s, d) => s + d.value, 0)}
                          />
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {/* Country distribution */}
                {profileStats.country_dist.length > 0 && (
                  <section className="admin-section">
                    <span className="section-label">{t("admin.profileCountryDist")}</span>
                    <div className="admin-card">
                      {profileStats.country_dist.map(c => {
                        const max = profileStats.country_dist[0]?.value ?? 1;
                        return (
                          <div key={c.name} className="admin-bar-row">
                            <span className="admin-bar-label">{c.name}</span>
                            <div className="admin-bar-track">
                              <div
                                className="admin-bar-fill"
                                style={{ width: `${Math.round((c.value / max) * 100)}%` }}
                              />
                            </div>
                            <span className="admin-bar-pct">{c.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* SURVEY TAB */}
      {activeTab === "survey" && (
        <div className="admin-tab-content">
          {surveyData.length === 0 ? (
            <p>{t("admin.loading")}</p>
          ) : (() => {
            const d = surveyData.map(normalizeSurveyRow);
            const total = d.length;

            // ── Aggregations ──
            const wantsAccess = d.filter(r =>
              r.wants_early_access === "Sí" || r.wants_early_access === "Yes"
            ).length;

            const platformCounts = countBy(d as any[], "platform");
            const platformData = Object.entries(platformCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([name, value]) => ({ name, value }));

            const freqCounts = countBy(d as any[], "frequency");
            const freqLabels: Record<string, string> = {
              "Varias veces a la semana": "Varias veces/sem",
              "A diario": "A diario",
              "Every day": "A diario",
              "Una vez a la semana": "Una vez/sem",
              "Once a week": "Una vez/sem",
              "De vez en cuando": "Ocasionalmente",
              "Unas cuantas veces al mes": "Varias veces/mes",
            };
            const freqData = Object.entries(freqCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([name, value]) => ({ name: freqLabels[name] ?? name, value }));

            const keepsLabels: Record<string, string> = {
              "Sí, en una aplicación de notas": "App de notas",
              "No, suelo guardar las ideas en mi cabeza": "En la cabeza",
              "No, I usually keep ideas in my head": "En la cabeza",
              "Sí, en una herramienta de productividad (Notion, etc.)": "Notion / Productividad",
              "Sí, en hojas de cálculo": "Spreadsheet",
            };
            const keepsCounts = countBy(d as any[], "keeps_ideas");
            const keepsData = Object.entries(keepsCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([name, value]) => ({ name: keepsLabels[name] ?? name, value }));

            const reusesLabels: Record<string, string> = {
              "A veces": "A veces", "Sometimes": "A veces",
              "A menudo": "A menudo", "Often": "A menudo",
              "Rara vez": "Rara vez", "Rarely": "Rara vez",
            };
            const reusesCounts = countBy(d as any[], "reuses_ideas");
            const reusesData = Object.entries(reusesCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([name, value]) => ({ name: reusesLabels[name] ?? name, value }));

            const seriesLabels: Record<string, string> = {
              "A veces": "A veces", "Sometimes": "A veces",
              "Sí, con frecuencia": "Sí, frecuentemente", "Yes, often": "Sí, frecuentemente",
              "Nunca": "Nunca", "Never": "Nunca",
              "Rara vez": "Rara vez", "Rarely": "Rara vez",
            };
            const seriesCounts = countBy(d as any[], "creates_series");
            const seriesData = Object.entries(seriesCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([name, value]) => ({ name: seriesLabels[name] ?? name, value }));

            const ideasMulti = [
              { label: t("admin.surveyIdeasRandom"),   count: countTrue(d, "ideas_random") },
              { label: t("admin.surveyIdeasNotes"),    count: countTrue(d, "ideas_notes") },
              { label: t("admin.surveyIdeasTrends"),   count: countTrue(d, "ideas_trends") },
              { label: t("admin.surveyIdeasAudience"), count: countTrue(d, "ideas_audience") },
              { label: t("admin.surveyIdeasAI"),       count: countTrue(d, "ideas_ai") },
              { label: t("admin.surveyIdeasSystem"),   count: countTrue(d, "ideas_system") },
            ].sort((a, b) => b.count - a.count);

            const knowsMulti = [
              { label: t("admin.surveyKnowsAnalytics"), count: countTrue(d, "knows_what_works_analytics") },
              { label: t("admin.surveyKnowsIntuition"), count: countTrue(d, "knows_what_works_intuition") },
              { label: t("admin.surveyKnowsAudience"),  count: countTrue(d, "knows_what_works_audience") },
              { label: t("admin.surveyKnowsUnsure"),    count: countTrue(d, "knows_what_works_unsure") },
            ].sort((a, b) => b.count - a.count);

            const contentMulti = [
              { label: t("admin.surveyContentEducational"),   count: countTrue(d, "content_educational") },
              { label: t("admin.surveyContentMixed"),         count: countTrue(d, "content_mixed") },
              { label: t("admin.surveyContentEntertainment"), count: countTrue(d, "content_entertainment") },
              { label: t("admin.surveyContentReviews"),       count: countTrue(d, "content_reviews") },
              { label: t("admin.surveyContentPersonal"),      count: countTrue(d, "content_personal") },
              { label: t("admin.surveyContentTutorials"),     count: countTrue(d, "content_tutorials") },
            ].sort((a, b) => b.count - a.count);

            const difficultCounts = countBy(d as any[], "most_difficult");
            const difficultLabels: Record<string, string> = {
              "Entender qué funciona": "Entender qué funciona",
              "Encontrar ideas": "Encontrar ideas",
              "Find ideas": "Encontrar ideas",
              "Organizar el contenido": "Organizar el contenido",
              "Organize your content": "Organizar el contenido",
              "Decidir qué publicar a continuación": "Decidir qué publicar",
              "Mantener la coherencia": "Mantener coherencia",
              "Maintain consistency": "Mantener coherencia",
            };
            const difficultData = Object.entries(difficultCounts)
              .map(([name, value]) => ({ name: difficultLabels[name] ?? name, value }))
              .reduce((acc: { name: string; value: number }[], item) => {
                const existing = acc.find(x => x.name === item.name);
                if (existing) existing.value += item.value;
                else acc.push({ ...item });
                return acc;
              }, [])
              .sort((a, b) => b.value - a.value);

            const valuableCounts = countBy(d as any[], "most_valuable");
            const valuableLabels: Record<string, string> = {
              "Entender qué es lo que mejor funciona": "Entender qué funciona",
              "Convertir ideas en series de contenido": "Ideas → series",
              "Descubrir nuevas ideas de contenido": "Descubrir ideas",
              "Identificar patrones en mi contenido": "Identificar patrones",
              "Turn ideas into content series": "Ideas → series",
              "Discover new content ideas": "Descubrir ideas",
              "Identify patterns in my content": "Identificar patrones",
              "Organize my ideas": "Organizar ideas",
            };
            const valuableData = Object.entries(valuableCounts)
              .map(([name, value]) => ({ name: valuableLabels[name] ?? name, value }))
              .reduce((acc: { name: string; value: number }[], item) => {
                const existing = acc.find(x => x.name === item.name);
                if (existing) existing.value += item.value;
                else acc.push({ ...item });
                return acc;
              }, [])
              .sort((a, b) => b.value - a.value);

            const maxDifficult = difficultData[0]?.value ?? 1;
            const maxValuable = valuableData[0]?.value ?? 1;
            const maxMulti = Math.max(...ideasMulti.map(x => x.count), 1);

            const openResponses = d.filter(r => r.workflow_wish);
            const openTotal = openResponses.length;
            const openPages = Math.ceil(openTotal / SURVEY_OPEN_LIMIT);
            const openPaginated = openResponses.slice(
              (surveyOpenPage - 1) * SURVEY_OPEN_LIMIT,
              surveyOpenPage * SURVEY_OPEN_LIMIT
            );

            return (
              <>
                {/* ── KPIs ── */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.surveyOverview")}</span>
                  <div className="admin-stats">
                    <div className="admin-card stat-card">
                      <div className="stat-value admin-highlight">{total}</div>
                      <div className="stat-label">{t("admin.surveyTotalResponses")}</div>
                    </div>
                    <div className="admin-card stat-card">
                      <div className="stat-value admin-highlight">{wantsAccess}</div>
                      <div className="stat-label">{t("admin.surveyWantsAccess")}</div>
                    </div>
                    <div className="admin-card stat-card">
                      <div className="stat-value admin-highlight">
                        {Math.round((wantsAccess / total) * 100)}%
                      </div>
                      <div className="stat-label">{t("admin.surveyAccessRate")}</div>
                    </div>
                    <div className="admin-card stat-card">
                      <div className="stat-value admin-highlight">{openTotal}</div>
                      <div className="stat-label">{t("admin.surveyOpenResponses")}</div>
                    </div>
                  </div>
                </section>

                {/* ── Plataforma + Frecuencia ── */}
                <div className="admin-two-col">
                  <section className="admin-section" style={{ display: "flex", flexDirection: "column" }}>
                    <span className="section-label">{t("admin.surveyPlatform")}</span>
                    <div className="admin-card admin-card--chart" style={{ flex: 1 }}>
                      <WaitlistDonut data={platformData} colors={PLATFORM_COLORS} total={total} />
                    </div>
                  </section>
                  <section className="admin-section">
                    <span className="section-label">{t("admin.surveyFrequency")}</span>
                    <div className="admin-card admin-card--chart">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={freqData}
                          margin={{ top: 8, right: 16, left: -20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            height={60}
                            tick={(props: any) => {
                              const { x, y, payload } = props;
                              const words = payload.value.split(" ");
                              const lines: string[] = [];
                              let current = "";
                              words.forEach((w: string) => {
                                if ((current + " " + w).trim().length > 10 && current) {
                                  lines.push(current.trim());
                                  current = w;
                                } else {
                                  current = (current + " " + w).trim();
                                }
                              });
                              if (current) lines.push(current.trim());
                              return (
                                <g transform={`translate(${x},${y})`}>
                                  {lines.map((line, i) => (
                                    <text
                                      key={i}
                                      x={0} y={0}
                                      dy={14 + i * 14}
                                      textAnchor="middle"
                                      fill="var(--text-faint)"
                                      fontSize={11}
                                      fontFamily="var(--font-mono)"
                                    >
                                      {line}
                                    </text>
                                  ))}
                                </g>
                              );
                            }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "var(--text-faint)" }}
                            axisLine={false} tickLine={false} allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--r-3)",
                              fontSize: 12, color: "var(--text)",
                              boxShadow: "var(--shadow-md)",
                            }}
                            formatter={(value) => [(value ?? 0), t("admin.surveyResponses")] as [number, string]}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {freqData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={[
                                  "var(--primary)",
                                  "var(--accent)",
                                  "var(--pastel-primary-d)",
                                  "var(--pastel-accent-d)",
                                  "var(--pastel-primary)",
                                  "var(--pastel-accent)",
                                ][i % 6]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>

                {/* ── Comportamiento creativo: 3 donuts ── */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.surveyCreativeBehavior")}</span>
                  <div className="admin-three-col">
                    <div className="admin-card admin-card--chart">
                      <p className="admin-section-hint">{t("admin.surveyKeepsIdeas")}</p>
                      <WaitlistDonut data={keepsData} colors={["var(--primary)", "var(--accent)", "var(--pastel-primary-d)", "var(--pastel-accent-d)"]} total={total} />
                    </div>
                    <div className="admin-card admin-card--chart">
                      <p className="admin-section-hint">{t("admin.surveyReusesIdeas")}</p>
                      <WaitlistDonut data={reusesData} colors={["var(--primary)", "var(--pastel-primary-d)", "var(--accent)"]} total={total} />
                    </div>
                    <div className="admin-card admin-card--chart">
                      <p className="admin-section-hint">{t("admin.surveyCreatesSeries")}</p>
                      <WaitlistDonut data={seriesData} colors={["var(--primary)", "var(--accent)", "var(--pastel-border)", "var(--pastel-accent)"]} total={total} />
                    </div>
                  </div>
                </section>

                {/* ── Tipo de contenido + Generación de ideas ── */}
                <div className="admin-two-col">
                  <section className="admin-section">
                    <span className="section-label">{t("admin.surveyContentType")}</span>
                    <div className="admin-card">
                      {contentMulti.map(item => (
                        <div key={item.label} className="admin-bar-row">
                          <span className="admin-bar-label">{item.label}</span>
                          <div className="admin-bar-track">
                            <div className="admin-bar-fill" style={{ width: `${Math.round((item.count / total) * 100)}%` }} />
                          </div>
                          <span className="admin-bar-pct">{item.count}</span>
                        </div>
                      ))}
                      <p className="admin-section-hint" style={{ marginTop: "var(--s-3)" }}>
                        {t("admin.surveyMultiSelectHint")}
                      </p>
                    </div>
                  </section>
                  <section className="admin-section">
                    <span className="section-label">{t("admin.surveyIdeaGeneration")}</span>
                    <div className="admin-card">
                      {ideasMulti.map(item => (
                        <div key={item.label} className="admin-bar-row">
                          <span className="admin-bar-label">{item.label}</span>
                          <div className="admin-bar-track">
                            <div className="admin-bar-fill" style={{ width: `${Math.round((item.count / maxMulti) * 100)}%` }} />
                          </div>
                          <span className="admin-bar-pct">{item.count}</span>
                        </div>
                      ))}
                      <p className="admin-section-hint" style={{ marginTop: "var(--s-3)" }}>
                        {t("admin.surveyMultiSelectHint")}
                      </p>
                    </div>
                  </section>
                </div>

                {/* ── Cómo miden qué funciona ── */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.surveyKnowsWhatWorks")}</span>
                  <div className="admin-card">
                    {knowsMulti.map(item => (
                      <div key={item.label} className="admin-bar-row">
                        <span className="admin-bar-label">{item.label}</span>
                        <div className="admin-bar-track">
                          <div className="admin-bar-fill" style={{ width: `${Math.round((item.count / total) * 100)}%` }} />
                        </div>
                        <span className="admin-bar-pct">{item.count}</span>
                      </div>
                    ))}
                    <p className="admin-section-hint" style={{ marginTop: "var(--s-3)" }}>
                      {t("admin.surveyMultiSelectHint")}
                    </p>
                  </div>
                </section>

                {/* ── Pain points — barras horizontales ── */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.surveyMostDifficult")}</span>
                  <div className="admin-card">
                    {difficultData.map(item => (
                      <div key={item.name} className="admin-bar-row">
                        <span className="admin-bar-label">{item.name}</span>
                        <div className="admin-bar-track">
                          <div
                            className="admin-bar-fill admin-bar-fill--accent"
                            style={{ width: `${Math.round((item.value / maxDifficult) * 100)}%` }}
                          />
                        </div>
                        <span className="admin-bar-pct">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── Feature más valiosa — Radar ── */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.surveyMostValuable")}</span>
                  <div className="admin-card admin-card--chart">
                    <ResponsiveContainer width="100%" height={520}>
                      <RadarChart data={valuableData} margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
                        <PolarGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                        <PolarAngleAxis
                          dataKey="name"
                          tick={({ x, y, cx, payload }: any) => {
                            const isRight = x > cx;
                            const words = payload.value.split(" ");
                            const lines: string[] = [];
                            let current = "";
                            words.forEach((w: string) => {
                              if ((current + " " + w).trim().length > 16 && current) {
                                lines.push(current.trim());
                                current = w;
                              } else {
                                current = (current + " " + w).trim();
                              }
                            });
                            if (current) lines.push(current);
                            return (
                              <g>
                                {lines.map((line, i) => (
                                  <text
                                    key={i}
                                    x={x}
                                    y={y + (i - (lines.length - 1) / 2) * 16}
                                    textAnchor={isRight ? "start" : x === cx ? "middle" : "end"}
                                    dominantBaseline="central"
                                    fill="var(--text-secondary)"
                                    fontSize={12}
                                    fontFamily="var(--font-sans)"
                                  >
                                    {line}
                                  </text>
                                ))}
                              </g>
                            );
                          }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, maxValuable]}
                          tick={{ fontSize: 10, fill: "var(--text-faint)" }}
                          axisLine={false}
                          tickCount={maxValuable + 1}
                        />
                        <Radar
                          name={t("admin.surveyResponses")}
                          dataKey="value"
                          stroke="var(--accent)"
                          fill="var(--accent)"
                          fillOpacity={0.2}
                          strokeWidth={2.5}
                          dot={{ fill: "var(--accent)", r: 5, strokeWidth: 0 } as any}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-3)",
                            fontSize: 12, color: "var(--text)",
                            boxShadow: "var(--shadow-md)",
                          }}
                          formatter={(value) => [(value ?? 0), t("admin.surveyResponses")] as [number, string]}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* ── Respuestas abiertas paginadas ── */}
                <section className="admin-section">
                  <span className="section-label">
                    {t("admin.surveyWorkflowWish")} ({openTotal})
                  </span>
                  <div className="admin-card">
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th style={{ width: 60 }}>{t("admin.lang")}</th>
                            <th style={{ width: 100 }}>{t("admin.platform")}</th>
                            <th>{t("admin.surveyWishResponse")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {openPaginated.map((r, i) => (
                            <tr key={i}>
                              <td>
                                <span className={`admin-badge ${
                                  (r.language ?? "en") === "es"
                                    ? "admin-badge--invited"
                                    : "admin-badge--pending"
                                }`}>
                                  {(r.language ?? "en").toUpperCase()}
                                </span>
                              </td>
                              <td style={{ color: "var(--text-secondary)", fontSize: "var(--fs-12)" }}>
                                {r.platform}
                              </td>
                              <td style={{ color: "var(--text-secondary)" }}>
                                {r.workflow_wish}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {openPages > 1 && (
                      <div className="admin-pagination">
                        <button disabled={surveyOpenPage === 1} onClick={() => setSurveyOpenPage(p => p - 1)} type="button">‹</button>
                        <span>{surveyOpenPage} of {openPages}</span>
                        <button disabled={surveyOpenPage >= openPages} onClick={() => setSurveyOpenPage(p => p + 1)} type="button">›</button>
                      </div>
                    )}
                  </div>
                </section>
              </>
            );
          })()}
        </div>
      )}

    </div>
  );
}
