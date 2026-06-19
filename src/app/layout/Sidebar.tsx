import { Lightbulb, FileText, Sparkles, BarChart3, Shield, User, X, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "../../features/profile/hooks/useUserProfile";
import { useAvatarUrl, type AvatarConfig } from "../../features/profile/hooks/useAvatarUrl";
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
  const { profile } = useUserProfile();
  const displayName = profile?.display_name ?? null;
  const avatarUrl = useAvatarUrl(
    displayName ?? "creator",
    (profile?.avatar_config as AvatarConfig) ?? {}
  );
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
            <h2 className="sidebar__title">Creadora</h2>
            <div className="sidebar__user">
              <img
                src={avatarUrl}
                alt="avatar"
                className="sidebar__avatar"
                width={32}
                height={32}
              />
              <span className="sidebar__greeting">
                {displayName ? `${t("nav.hello")}, ${displayName}` : t("nav.hello")}
              </span>
            </div>
          </>
        )}
        {isCollapsed && (
          <div className="sidebar__avatar-collapsed">
            <img
              src={avatarUrl}
              alt="avatar"
              className="sidebar__avatar"
              width={32}
              height={32}
            />
          </div>
        )}

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
          {/* TOUR NAV ITEMS — con tooltip anclado */}
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
