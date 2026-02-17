import "./Footer.scss";

export default function Footer() {
  const version =
    import.meta.env.VITE_APP_VERSION;

  const buildDate =
    import.meta.env.VITE_BUILD_DATE;

  const appName =
    import.meta.env.VITE_APP_NAME;

  const formattedDate = buildDate
    ? new Date(buildDate).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      )
    : "—";

  return (
    <footer className="footer">
      <div className="footer__content">
        <span>
          © {new Date().getFullYear()}{" "}
          {appName}
        </span>

        <span>
          v{version}
        </span>

        <span>
          Build {formattedDate}
        </span>
      </div>
    </footer>
  );
}
