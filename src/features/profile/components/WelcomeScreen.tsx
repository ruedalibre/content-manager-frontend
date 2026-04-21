import { useState } from "react";
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
   QUESTIONS CONFIG
========================= */

const QUESTIONS = [
  {
    id: "time_availability",
    question:
      "¿Cuánto tiempo dedicas habitualmente a crear contenido cada semana?",
    type: "single",
    options: [
      {
        value: "less_than_2h",
        label: "Menos de 2 horas",
        desc: "Creo cuando puedo",
      },
      {
        value: "2_to_5h",
        label: "Entre 2 y 5 horas",
        desc: "Tengo momentos definidos",
      },
      {
        value: "more_than_5h",
        label: "Más de 5 horas",
        desc: "Es una actividad central en mi semana",
      },
      { value: "variable", label: "Variable", desc: "No tengo un ritmo fijo" },
    ],
  },
  {
    id: "production_setup",
    question: "¿Cómo describes tu proceso de producción actual?",
    type: "single",
    options: [
      { value: "solo", label: "Trabajo solo", desc: "Hago todo yo mismo" },
      {
        value: "occasional_help",
        label: "Ayuda ocasional",
        desc: "Alguien me apoya cuando puede",
      },
      {
        value: "small_team",
        label: "Equipo pequeño",
        desc: "Hay roles definidos",
      },
      {
        value: "agency",
        label: "Agencia o equipo externo",
        desc: "Trabajo con apoyo profesional",
      },
    ],
  },
  {
    id: "idea_sources",
    question: "¿De dónde vienen principalmente tus ideas para crear contenido?",
    type: "multi",
    options: [
      {
        value: "content_consumption",
        label: "De lo que leo, veo o escucho",
        desc: "Me nutro de contenido de otros",
      },
      {
        value: "personal_experience",
        label: "De mi experiencia personal",
        desc: "Mi vivencia es mi materia prima",
      },
      {
        value: "community",
        label: "De conversaciones con mi audiencia",
        desc: "Mi comunidad me inspira",
      },
      {
        value: "trends",
        label: "De tendencias en redes sociales",
        desc: "Respondo a lo que está pasando",
      },
    ],
  },
  {
    id: "referents",
    question:
      "¿Hay algún creador, medio o referente que admires especialmente?",
    type: "text",
    placeholder: "Ej: Lex Fridman, National Geographic, Tim Ferriss...",
    optional: true,
  },
];

/* =========================
   COMPONENT
========================= */

export default function WelcomeScreen({ onComplete, onSkip }: Props) {
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
            Bienvenido a Content Intelligence
          </h1>

          <p className="welcome-screen__subtitle">
            Esta plataforma te ayuda a entender cómo tus ideas evolucionan en
            sistemas de contenido escalables. Cuanto más la uses, más precisa se
            vuelve.
          </p>

          <div className="welcome-screen__how">
            <div className="welcome-screen__step">
              <span className="welcome-screen__step-num">01</span>
              <div>
                <strong>Registra tus ideas y topics</strong>
                <p>La unidad central no es el post — es la idea.</p>
              </div>
            </div>
            <div className="welcome-screen__step">
              <span className="welcome-screen__step-num">02</span>
              <div>
                <strong>Genera Recetas de Contenido</strong>
                <p>
                  La IA analiza tus patrones y te sugiere cómo desarrollar cada
                  idea.
                </p>
              </div>
            </div>
            <div className="welcome-screen__step">
              <span className="welcome-screen__step-num">03</span>
              <div>
                <strong>Descubre tu DNA creativo</strong>
                <p>
                  Con el tiempo, la plataforma te devuelve una lectura profunda
                  de tu proceso.
                </p>
              </div>
            </div>
          </div>

          <div className="welcome-screen__actions">
            <button
              className="btn-primary welcome-screen__btn-main"
              onClick={() => setStep("questions")}
              type="button"
            >
              Cuéntanos sobre ti →
            </button>
            <button
              className="welcome-screen__btn-skip"
              onClick={handleSkip}
              type="button"
            >
              Empezar a explorar
            </button>
          </div>

          <p className="welcome-screen__note">
            Las preguntas son opcionales y nos ayudan a personalizar tu
            experiencia desde el inicio.
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
          <p className="onboarding-optional">Opcional</p>
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
              Puedes seleccionar varias opciones
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
            ← Anterior
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleNext}
            disabled={saving}
          >
            {saving ? "Guardando..." : isLast ? "Finalizar ✓" : "Siguiente →"}
          </button>
        </div>

        <button
          type="button"
          className="welcome-screen__btn-skip"
          onClick={handleSkip}
        >
          Saltar y explorar
        </button>
      </div>
    </div>
  );
}
