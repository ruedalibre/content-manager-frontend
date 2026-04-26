import "./Admin.scss";

/* =========================
   MOCK DATA
========================= */

const stats = [
  { label: "Users", value: 12 },
  { label: "Contents", value: 685 },
  { label: "Reusable Ideas", value: 32 },
  { label: "Platforms", value: 6 },
];

const recentActivity = [
  "User created new content",
  "Reusable idea extracted from YouTube video",
  "Content tagged with Productivity",
  "New reusable idea added",
  "Content published on Instagram",
];

const platformConfig = [
  {
    title: "Platforms",
    description: "Manage supported content platforms",
  },
  {
    title: "Formats",
    description: "Define content formats",
  },
  {
    title: "Topics",
    description: "Content pillars and themes",
  },
  {
    title: "Tags",
    description: "Content classification system",
  },
];

const intelligenceSignals = [
  {
    label: "Video Content",
    value: 54,
  },
  {
    label: "Post",
    value: 23,
  },
  {
    label: "Carousel",
    value: 11,
  },
];

/* =========================
   COMPONENT
========================= */

export default function Admin() {
  return (
    <div className="admin-page">
      {/* HEADER */}

      <div className="admin-header">
        <div className="admin-header__title">
          <h2>Admin Console</h2>
          <p>System overview and platform intelligence</p>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          System healthy
        </div>
      </div>

      {/* SYSTEM OVERVIEW */}

      <section className="admin-section">
        <h3>System Overview</h3>

        <div className="admin-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="admin-card stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SYSTEM ACTIVITY */}

      <section className="admin-section">
        <h3>Recent Activity</h3>

        <div className="admin-card">
          <ul className="activity-list">
            {recentActivity.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* PLATFORM CONFIGURATION */}

      <section className="admin-section">
        <h3>Platform Configuration</h3>

        <div className="admin-grid">
          {platformConfig.map((item) => (
            <div key={item.title} className="admin-card config-card">
              <h4>{item.title}</h4>

              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DATA INTELLIGENCE */}

      <section className="admin-section">
        <h3>Content Intelligence Signals</h3>

        <div className="admin-card">
          {intelligenceSignals.map((signal) => (
            <div key={signal.label} className="signal-row">
              <span className="signal-label">{signal.label}</span>

              <div className="signal-bar">
                <div
                  className="signal-bar-fill"
                  style={{ width: `${signal.value}%` }}
                />
              </div>

              <span className="signal-value">{signal.value}%</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
