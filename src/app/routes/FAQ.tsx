import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Legal.scss";
import "./FAQ.scss";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQCategory = {
  title: string;
  items: FAQItem[];
};

export default function FAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  useEffect(() => {
    document.title = t("faq.pageTitle");
    window.scrollTo(0, 0);
  }, [t]);

  const toggle = (key: string) => {
    setOpenIndex((prev) => (prev === key ? null : key));
  };

  const categories: FAQCategory[] = [
    {
      title: t("faq.cat.product"),
      items: [
        { question: t("faq.q.whatIs"),       answer: t("faq.a.whatIs") },
        { question: t("faq.q.vsChatgpt"),     answer: t("faq.a.vsChatgpt") },
        { question: t("faq.q.generatesContent"), answer: t("faq.a.generatesContent") },
        { question: t("faq.q.forWho"),        answer: t("faq.a.forWho") },
      ],
    },
    {
      title: t("faq.cat.workflow"),
      items: [
        { question: t("faq.q.whereToStart"), answer: t("faq.a.whereToStart") },
        { question: t("faq.q.whatIsBrief"),  answer: t("faq.a.whatIsBrief") },
        { question: t("faq.q.whatAreTopics"), answer: t("faq.a.whatAreTopics") },
        { question: t("faq.q.multipleBriefs"), answer: t("faq.a.multipleBriefs") },
        { question: t("faq.q.briefStatus"),  answer: t("faq.a.briefStatus") },
        { question: t("faq.q.editBrief"),    answer: t("faq.a.editBrief") },
      ],
    },
    {
      title: t("faq.cat.ideasContents"),
      items: [
        { question: t("faq.q.manualVsSuggested"), answer: t("faq.a.manualVsSuggested") },
        { question: t("faq.q.contentsPage"),      answer: t("faq.a.contentsPage") },
        { question: t("faq.q.location"),          answer: t("faq.a.location") },
      ],
    },
    {
      title: t("faq.cat.insights"),
      items: [
        { question: t("faq.q.identityPage"),  answer: t("faq.a.identityPage") },
        { question: t("faq.q.emptyInsights"), answer: t("faq.a.emptyInsights") },
        { question: t("faq.q.activityPage"),  answer: t("faq.a.activityPage") },
      ],
    },
    {
      title: t("faq.cat.plans"),
      items: [
        { question: t("faq.q.freePlan"),   answer: t("faq.a.freePlan") },
        { question: t("faq.q.creatorPlan"), answer: t("faq.a.creatorPlan") },
        { question: t("faq.q.trial"),      answer: t("faq.a.trial") },
        { question: t("faq.q.cancel"),     answer: t("faq.a.cancel") },
      ],
    },
    {
      title: t("faq.cat.privacy"),
      items: [
        { question: t("faq.q.training"),  answer: t("faq.a.training") },
        { question: t("faq.q.security"),  answer: t("faq.a.security") },
      ],
    },
  ];

  return (
    <div className="legal-page">
      {/* Nav */}
      <nav className="legal-nav">
        <div className="legal-nav__inner">
          <Link to="/" className="legal-nav__logo">
            Content <span>Intelligence</span>
          </Link>
          <Link to="/" className="legal-nav__back">
            {t("faq.backToApp")}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="legal-hero">
        <div className="legal-hero__band" aria-hidden="true" />
        <div className="legal-hero__inner">
          <p className="legal-hero__label">{t("faq.heroLabel")}</p>
          <h1 className="legal-hero__title">{t("faq.heroTitle")}</h1>
          <div className="legal-hero__meta">
            <span>{t("faq.heroSubtitle")}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="faq-layout">
        <main className="faq-content">
          {categories.map((cat, ci) => (
            <section key={ci} className="faq-category">
              <h2 className="faq-category__title">{cat.title}</h2>
              <div className="faq-list">
                {cat.items.map((item, ii) => {
                  const key = `${ci}-${ii}`;
                  const isOpen = openIndex === key;
                  return (
                    <div key={key} className="faq-item">
                      <button
                        type="button"
                        className={`faq-item__question ${isOpen ? "faq-item__question--open" : ""}`}
                        onClick={() => toggle(key)}
                        aria-expanded={isOpen}
                      >
                        <span>{item.question}</span>
                        <span className={`faq-item__icon ${isOpen ? "faq-item__icon--open" : ""}`} aria-hidden="true">
                          ▾
                        </span>
                      </button>
                      {isOpen && (
                        <div className="faq-item__answer">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </main>
      </div>

      {/* Footer */}
      <footer className="legal-footer">
        <div className="legal-footer__inner">
          <p>
            © {new Date().getFullYear()} Content Intelligence Platform ·{" "}
            <Link to="/terms">{t("footer.terms")}</Link> ·{" "}
            <Link to="/privacy">{t("footer.privacy")}</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
