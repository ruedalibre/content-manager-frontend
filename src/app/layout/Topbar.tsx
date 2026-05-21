import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Topbar.scss";

type Props = {
  onMenuClick: () => void;
  context?: string | null;
};

export default function Topbar({ onMenuClick, context }: Props) {
  const location = useLocation();

  const { t } = useTranslation();

  const titles: Record<string, string> = {
    "/insights": t("nav.identity"),
    "/contents": t("nav.contents"),
    "/ideas": t("nav.ideas"),
    "/identity": t("nav.identity"),
    "/activity": t("nav.activity"),
    "/admin": t("nav.admin"),
    "/profile": t("nav.profile"),
  };
  const title = titles[location.pathname] ?? t("nav.ideas");

  return (
    <header className="topbar">
      <button type="button" className="topbar__menu-btn" onClick={onMenuClick}>
        <Menu size={22} />
      </button>

      <div className="topbar__text">
        <h1 className="topbar__title">{title}</h1>

        {context && <span className="topbar__context">{context}</span>}
      </div>

    </header>
  );
}
