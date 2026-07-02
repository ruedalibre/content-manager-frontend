import { useEffect } from "react";
import { Lightbulb, FileText, Sparkles, BarChart3, Shield, User, X, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "../../features/profile/hooks/useUserProfile";
import WorkspaceSelector from "./WorkspaceSelector";
import "./Sidebar.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  tourStep: number | null;
  onTourAction: (action: 'next' | 'skip') => void;
};

const TOUR_NAV = [
  { key: 'ideas',    to: '/ideas',    icon: <Lightbulb size={18} />, tourIndex: 0 },
  { key: 'contents', to: '/contents', icon: <FileText size={18} />,  tourIndex: 1 },
  { key: 'identity', to: '/identity', icon: <Sparkles size={18} />,  tourIndex: 2 },
  { key: 'activity', to: '/activity', icon: <BarChart3 size={18} />, tourIndex: 3 },
  { key: 'profile',  to: '/profile',  icon: <User size={18} />,      tourIndex: 4 },
] as const;

const TOTAL_STEPS = TOUR_NAV.length;

export default function Sidebar({ isOpen, onClose, onLogout, isAdmin, isCollapsed, onToggleCollapse, tourStep, onTourAction }: Props) {
  const { t } = useTranslation();
  const { profile, loadProfile } = useUserProfile();

  useEffect(() => {
    const handler = () => loadProfile();
    globalThis.addEventListener("profile-updated", handler);
    return () => globalThis.removeEventListener("profile-updated", handler);
  }, [loadProfile]);

  const displayName = profile?.display_name ?? null;

  function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  function getAvatarColor(userId: string | undefined): string {
    const colors = [
      "#c47859", "#364965", "#4a8a6e", "#b88a3d",
      "#5a7896", "#8e533a", "#4a5568", "#b65a48",
    ];
    if (!userId) return colors[0];
    const hash = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(profile?.user_id);
  const isLast = tourStep === TOTAL_STEPS - 1;

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${isOpen ? " sidebar--open" : ""}${isCollapsed ? " sidebar--collapsed" : ""}`}>
        {/* MOBILE HEADER */}
        <div className="sidebar__header sidebar__header--mobile">
          <h2>Content Intelligence Platform</h2>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>

        {/* TITLE + SALUDO */}
        {!isCollapsed && (
          <>
            <h2 className="sidebar__title">Content Intelligence Platform</h2>
            <div className="sidebar__user">
              <div className="sidebar__avatar" style={{ background: avatarColor }}>
                {initials}
              </div>
              <span className="sidebar__greeting">
                {displayName ? `${t("nav.hello")}, ${displayName}` : t("nav.hello")}
              </span>
            </div>
          </>
        )}
        {isCollapsed && (
          <div className="sidebar__avatar-collapsed">
            <div className="sidebar__avatar" style={{ background: avatarColor }}>
              {initials}
            </div>
          </div>
        )}

        {/* WORKSPACE SELECTOR */}
        <WorkspaceSelector isCollapsed={isCollapsed} />

        {/* COLLAPSE BUTTON */}
        <button
          type="button"
          className="sidebar__collapse-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* NAVIGATION */}
        <nav className="sidebar__nav">
          {TOUR_NAV.map((item) => (
            <div
              key={item.key}
              className={`sidebar__nav-item-wrap${tourStep === item.tourIndex ? ' sidebar__nav-item-wrap--highlighted' : ''}`}
            >
              <NavLink to={item.to} onClick={onClose}>
                {item.icon}
                {!isCollapsed && <span>{t(`nav.${item.key}`)}</span>}
              </NavLink>
              {tourStep === item.tourIndex && (
                <div className="tour-tooltip" role="dialog" aria-modal="true">
                  <div className="tour-tooltip__header">
                    <span className="tour-tooltip__icon">{item.icon}</span>
                    <span className="tour-tooltip__count">
                      {item.tourIndex + 1} {t('tour.of')} {TOTAL_STEPS}
                    </span>
                  </div>
                  <h3 className="tour-tooltip__title">
                    {t(`tour.steps.${item.key}.title`)}
                  </h3>
                  <p className="tour-tooltip__desc">
                    {t(`tour.steps.${item.key}.description`)}
                  </p>
                  <div className="tour-tooltip__actions">
                    <button
                      className="tour-tooltip__skip"
                      onClick={() => onTourAction('skip')}
                      type="button"
                    >
                      {t('tour.skipTour')}
                    </button>
                    <button
                      className="btn-primary tour-tooltip__next"
                      onClick={() => onTourAction('next')}
                      type="button"
                    >
                      {isLast ? t('tour.done') : t('tour.next')}
                    </button>
                  </div>
                  <div className="tour-tooltip__dots">
                    {TOUR_NAV.map((_, i) => (
                      <span
                        key={i}
                        className={`tour-tooltip__dot${i === tourStep ? ' tour-tooltip__dot--active' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ADMIN */}
          {isAdmin && (
            <NavLink to="/admin" onClick={onClose}>
              <Shield size={18} />
              {!isCollapsed && <span>{t("nav.admin")}</span>}
            </NavLink>
          )}
        </nav>

        {/* LOGOUT */}
        <button type="button" className="sidebar__logout" onClick={onLogout}>
          <LogOut size={16} />
          {!isCollapsed && <span>{t("nav.logout")}</span>}
        </button>
      </aside>
    </>
  );
}
