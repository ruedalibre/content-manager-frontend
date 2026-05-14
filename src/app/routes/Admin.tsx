import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../supabaseClient";
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

  const [earlyAccess, setEarlyAccess] = useState<EarlyAccessRequest[]>([]);
  const [earlyTotal, setEarlyTotal] = useState(0);
  const [earlyPage, setEarlyPage] = useState(1);
  const [earlyStatusFilter, setEarlyStatusFilter] = useState("all");
  const [earlyLangFilter, setEarlyLangFilter] = useState("all");
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const EARLY_LIMIT = 10;

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
    const loadEarlyAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        let url = `${base}/admin-early-access?page=${earlyPage}&limit=${EARLY_LIMIT}`;
        if (earlyStatusFilter !== "all") url += `&status=${earlyStatusFilter}`;
        if (earlyLangFilter !== "all") url += `&language=${earlyLangFilter}`;

        const res = await fetch(url, {
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

  const handleInvite = async (request: EarlyAccessRequest) => {
    setInviteError(null);
    try {
      setInvitingId(request.id);
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${base}/admin-invite-user`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id: request.id,
          access_url: "https://app.content-intel.app",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setInviteError(err.error || t("admin.failedInvite"));
        return;
      }

      setEarlyAccess((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? { ...r, status: "invited", invited_at: new Date().toISOString() }
            : r
        )
      );
    } catch (err) {
      console.error("Invite error:", err);
    } finally {
      setInvitingId(null);
    }
  };

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

  function extractKeywords(records: EarlyAccessRequest[]): { word: string; count: number }[] {
    const stop = new Set(["and","for","the","with","in","of","to","a","an","on","is","at","by","from","as","or","that","are","be","this","it","about","their","not","also","new","my","me","us","our","your","its","has","have","we","but","so","can","you","how","what","who","why","when","more","into","up","out","based","via","using","across","within","between","without","through","content","creator"]);
    const freq: Record<string, number> = {};
    records.forEach((r) => {
      if (!r.creator_focus) return;
      r.creator_focus.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/)
        .filter((w) => w.length > 3 && !stop.has(w))
        .forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([word, count]) => ({ word, count }));
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

          <section className="admin-section">
            <div className="admin-section__header">
              <span className="section-label">
                {t("admin.earlyAccessWaitlist")} ({earlyTotal})
              </span>
              <div className="admin-filters">
                <select
                  className="admin-filter"
                  value={earlyStatusFilter}
                  onChange={(e) => {
                    setEarlyStatusFilter(e.target.value);
                    setEarlyPage(1);
                  }}
                >
                  <option value="all">{t("admin.allStatus")}</option>
                  <option value="pending">{t("admin.pending")}</option>
                  <option value="invited">{t("admin.invited")}</option>
                </select>
                <select
                  className="admin-filter"
                  value={earlyLangFilter}
                  onChange={(e) => {
                    setEarlyLangFilter(e.target.value);
                    setEarlyPage(1);
                  }}
                >
                  <option value="all">{t("admin.allLanguages")}</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
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
                    <th>{t("admin.lang")}</th>
                    <th>{t("admin.status")}</th>
                    <th>{t("admin.requested")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {earlyAccess.map((r) => (
                    <tr key={r.id}>
                      <td>{r.email}</td>
                      <td>{r.platform_name ?? "—"}</td>
                      <td>{r.creator_focus ?? "—"}</td>
                      <td>{r.language?.toUpperCase()}</td>
                      <td>
                        <span
                          className={`admin-badge ${
                            r.status === "invited"
                              ? "admin-badge--invited"
                              : "admin-badge--pending"
                          }`}
                        >
                          {r.status}
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
                >
                  ‹
                </button>
                <span>
                  {earlyPage} of {Math.ceil(earlyTotal / EARLY_LIMIT)}
                </span>
                <button
                  disabled={earlyPage >= Math.ceil(earlyTotal / EARLY_LIMIT)}
                  onClick={() => setEarlyPage((p) => p + 1)}
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
            const keywords = extractKeywords(records);
            const sortedPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
            const maxPlatform = sortedPlatforms[0]?.[1] ?? 1;

            return (
              <>
                {/* KPIs */}
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

                <div className="admin-two-col">
                  {/* Crecimiento semanal */}
                  <section className="admin-section">
                    <span className="section-label">{t("admin.weeklyGrowth")}</span>
                    <div className="admin-card">
                      {weeklyData.map((w, i) => {
                        const maxCount = Math.max(...weeklyData.map(x => x.count));
                        const pct = Math.round((w.count / maxCount) * 100);
                        const d = new Date(w.week);
                        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        return (
                          <div key={i} className="admin-bar-row">
                            <span className="admin-bar-label admin-bar-label--mono">{label}</span>
                            <div className="admin-bar-track">
                              <div className="admin-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="admin-bar-pct">{w.count}</span>
                            <span className="admin-bar-cumulative">/{w.cumulative}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Plataformas */}
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
                </div>

                {/* Keywords de creator_focus */}
                <section className="admin-section">
                  <span className="section-label">{t("admin.creatorFocusThemes")}</span>
                  <div className="admin-card">
                    <p className="admin-section-hint">
                      {t("admin.creatorFocusHint", { count: records.filter(r => r.creator_focus).length })}
                    </p>
                    <div className="admin-keyword-cloud">
                      {keywords.map(({ word, count }) => (
                        <span
                          key={word}
                          className="admin-keyword"
                          style={{ fontSize: `${Math.max(11, Math.min(16, 10 + count * 1.2))}px` }}
                          title={`${count} mentions`}
                        >
                          {word}
                          <span className="admin-keyword__count">{count}</span>
                        </span>
                      ))}
                    </div>
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
