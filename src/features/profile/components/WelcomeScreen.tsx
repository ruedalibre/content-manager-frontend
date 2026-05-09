import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./WelcomeScreen.scss";

/* =========================
   TYPES
========================= */

type Props = {
  onComplete: (data: OnboardingData) => Promise<void>;
  onSkip: () => Promise<void>;
};

type OnboardingData = {
  time_availability?: string;
  production_setup?: string;
  idea_sources?: string[];
  referents?: string;
};

/* =========================
   COMPONENT
========================= */

export default function WelcomeScreen({ onComplete, onSkip }: Props) {
  const { t } = useTranslation();

  const QUESTIONS = [
    {
      id: "time_availability",
      question: t("onboarding.questions.time_availability.question"),
      type: "single",
      options: [
        { value: "less_than_2h", label: t("onboarding.questions.time_availability.options.less_than_2h.label"), desc: t("onboarding.questions.time_availability.options.less_than_2h.desc") },
        { value: "2_to_5h", label: t("onboarding.questions.time_availability.options.2_to_5h.label"), desc: t("onboarding.questions.time_availability.options.2_to_5h.desc") },
        { value: "more_than_5h", label: t("onboarding.questions.time_availability.options.more_than_5h.label"), desc: t("onboarding.questions.time_availability.options.more_than_5h.desc") },
        { value: "variable", label: t("onboarding.questions.time_availability.options.variable.label"), desc: t("onboarding.questions.time_availability.options.variable.desc") },
      ],
    },
    {
      id: "production_setup",
      question: t("onboarding.questions.production_setup.question"),
      type: "single",
      options: [
        { value: "solo", label: t("onboarding.questions.production_setup.options.solo.label"), desc: t("onboarding.questions.production_setup.options.solo.desc") },
        { value: "occasional_help", label: t("onboarding.questions.production_setup.options.occasional_help.label"), desc: t("onboarding.questions.production_setup.options.occasional_help.desc") },
        { value: "small_team", label: t("onboarding.questions.production_setup.options.small_team.label"), desc: t("onboarding.questions.production_setup.options.small_team.desc") },
        { value: "agency", label: t("onboarding.questions.production_setup.options.agency.label"), desc: t("onboarding.questions.production_setup.options.agency.desc") },
      ],
    },
    {
      id: "idea_sources",
      question: t("onboarding.questions.idea_sources.question"),
      type: "multi",
      options: [
        { value: "content_consumption", label: t("onboarding.questions.idea_sources.options.content_consumption.label"), desc: t("onboarding.questions.idea_sources.options.content_consumption.desc") },
        { value: "personal_experience", label: t("onboarding.questions.idea_sources.options.personal_experience.label"), desc: t("onboarding.questions.idea_sources.options.personal_experience.desc") },
        { value: "community", label: t("onboarding.questions.idea_sources.options.community.label"), desc: t("onboarding.questions.idea_sources.options.community.desc") },
        { value: "trends", label: t("onboarding.questions.idea_sources.options.trends.label"), desc: t("onboarding.questions.idea_sources.options.trends.desc") },
      ],
    },
    {
      id: "referents",
      question: t("onboarding.questions.referents.question"),
      type: "text",
      placeholder: t("onboarding.questions.referents.placeholder"),
      optional: true,
    },
  ];

  const [step, setStep] = useState<"welcome" | "questions" | "saving">(
    "welcome",
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<OnboardingData>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     HANDLERS
  ========================= */

  const handleSingleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelect = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const current =
        (prev[questionId as keyof OnboardingData] as string[]) ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [questionId]: updated };
    });
  };

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    setError(null);
    try {
      await onComplete(answers);
    } catch {
      setError("Hubo un error guardando tu perfil. Intenta de nuevo.");
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    await onSkip();
  };

  /* =========================
     RENDER — WELCOME
  ========================= */

  if (step === "welcome") {
    return (
      <div className="welcome-screen">
        <div className="welcome-screen__card">
          <div className="welcome-screen__icon">✦</div>

          <h1 className="welcome-screen__title">
            {t("onboarding.welcome")}
          </h1>

          <p className="welcome-screen__subtitle">
            {t("onboarding.welcomeSubtitle")}
          </p>

          <div className="welcome-screen__how">
            <div className="welcome-screen__step">
              <span className="welcome-screen__step-num">01</span>
              <div>
                <strong>{t("onboarding.step1Title")}</strong>
                <p>{t("onboarding.step1Desc")}</p>
              </div>
            </div>
            <div className="welcome-screen__step">
              <span className="welcome-screen__step-num">02</span>
              <div>
                <strong>{t("onboarding.step2Title")}</strong>
                <p>{t("onboarding.step2Desc")}</p>
              </div>
            </div>
            <div className="welcome-screen__step">
              <span className="welcome-screen__step-num">03</span>
              <div>
                <strong>{t("onboarding.step3Title")}</strong>
                <p>{t("onboarding.step3Desc")}</p>
              </div>
            </div>
          </div>

          <div className="welcome-screen__actions">
            <button
              className="btn-primary welcome-screen__btn-main"
              onClick={() => setStep("questions")}
              type="button"
            >
              {t("onboarding.tellUsAboutYou")}
            </button>
            <button
              className="welcome-screen__btn-skip"
              onClick={handleSkip}
              type="button"
            >
              {t("onboarding.startExploring")}
            </button>
          </div>

          <p className="welcome-screen__note">
            {t("onboarding.questionsOptional")}
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     RENDER — QUESTIONS
  ========================= */

  const question = QUESTIONS[currentQuestion];
  const isLast = currentQuestion === QUESTIONS.length - 1;
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="welcome-screen">
      <div className="welcome-screen__card welcome-screen__card--questions">
        {/* PROGRESS */}
        <div className="onboarding-progress">
          <div
            className="onboarding-progress__bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="onboarding-counter">
          {currentQuestion + 1} / {QUESTIONS.length}
        </p>

        {/* QUESTION */}
        <h2 className="onboarding-question">{question.question}</h2>

        {question.type === "optional" && (
          <p className="onboarding-optional">{t("onboarding.optional")}</p>
        )}

        {/* SINGLE SELECT */}
        {question.type === "single" && (
          <div className="onboarding-options">
            {question.options?.map((opt) => {
              const selected =
                answers[question.id as keyof OnboardingData] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`onboarding-option ${selected ? "onboarding-option--selected" : ""}`}
                  onClick={() => handleSingleSelect(question.id, opt.value)}
                >
                  <span className="onboarding-option__label">{opt.label}</span>
                  <span className="onboarding-option__desc">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* MULTI SELECT */}
        {question.type === "multi" && (
          <>
            <p className="onboarding-hint">
              {t("onboarding.selectMultiple")}
            </p>
            <div className="onboarding-options">
              {question.options?.map((opt) => {
                const selected = (
                  (answers[question.id as keyof OnboardingData] as string[]) ??
                  []
                ).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`onboarding-option ${selected ? "onboarding-option--selected" : ""}`}
                    onClick={() => handleMultiSelect(question.id, opt.value)}
                  >
                    <span className="onboarding-option__label">
                      {opt.label}
                    </span>
                    <span className="onboarding-option__desc">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* TEXT */}
        {question.type === "text" && (
          <div className="onboarding-text">
            <input
              type="text"
              placeholder={question.placeholder}
              value={
                (answers[question.id as keyof OnboardingData] as string) ?? ""
              }
              onChange={(e) => handleTextChange(question.id, e.target.value)}
              maxLength={150}
              className="onboarding-text__input"
            />
            <span className="onboarding-text__counter">
              {
                ((answers[question.id as keyof OnboardingData] as string) ?? "")
                  .length
              }
              /150
            </span>
          </div>
        )}

        {error && <p className="onboarding-error">{error}</p>}

        {/* NAVIGATION */}
        <div className="onboarding-nav">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleBack}
            disabled={currentQuestion === 0}
          >
            {t("onboarding.previous")}
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleNext}
            disabled={saving}
          >
            {saving ? t("onboarding.saving") : isLast ? t("onboarding.finish") : t("onboarding.next")}
          </button>
        </div>

        <button
          type="button"
          className="welcome-screen__btn-skip"
          onClick={handleSkip}
        >
          {t("onboarding.skipAndExplore")}
        </button>
      </div>
    </div>
  );
}
