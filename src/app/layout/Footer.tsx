import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Footer.scss";

export default function Footer() {
  const { t } = useTranslation();
  const version = import.meta.env.VITE_APP_VERSION;

  const buildDate = import.meta.env.VITE_BUILD_DATE;

  const appName = import.meta.env.VITE_APP_NAME;

  const formattedDate = buildDate
    ? new Date(buildDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <footer className="footer">
      <div className="footer__content">
        <span>
          © {new Date().getFullYear()} {appName}
        </span>

        <span>v{version}</span>

        <span>Build {formattedDate}</span>

        <span className="footer__separator">·</span>

        <Link
          to="/terms"
          className="footer__legal-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("footer.terms")}
        </Link>
        <span className="footer__separator">·</span>
        <Link
          to="/privacy"
          className="footer__legal-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("footer.privacy")}
        </Link>
        <span className="footer__separator">·</span>
        <Link
          to="/faq"
          className="footer__legal-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("footer.faq")}
        </Link>
      </div>
    </footer>
  );
}
