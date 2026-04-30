import { useState } from "react";
import "./GuidedTour.scss";

const TOUR_STEPS = [
  {
    target: 'ideas',
    title: 'Ideas & Topics',
    description: 'Start here. Create your ideas, organize them by topics, and generate AI-powered content briefs.',
    icon: '💡',
  },
  {
    target: 'contents',
    title: 'Contents',
    description: 'Register your published content and link it to the ideas that originated it.',
    icon: '📄',
  },
  {
    target: 'identity',
    title: 'Identity & Insights',
    description: 'Your creative mirror. Discover patterns, AI insights and how your identity as a creator evolves.',
    icon: '✦',
  },
  {
    target: 'activity',
    title: 'Activity',
    description: 'Track your publishing rhythm, growth trends and consistency over time.',
    icon: '📊',
  },
];

type Props = {
  onComplete: () => void;
};

export default function GuidedTour({ onComplete }: Props) {
  const [step, setStep] = useState(0);

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => onComplete();

  return (
    <>
      {/* OVERLAY */}
      <div className="guided-tour__overlay" />

      {/* TOOLTIP */}
      <div className={`guided-tour__tooltip guided-tour__tooltip--${current.target}`}>
        <div className="guided-tour__header">
          <span className="guided-tour__icon">{current.icon}</span>
          <span className="guided-tour__step-count">
            {step + 1} / {TOUR_STEPS.length}
          </span>
        </div>
        <h3 className="guided-tour__title">{current.title}</h3>
        <p className="guided-tour__desc">{current.description}</p>
        <div className="guided-tour__actions">
          <button
            className="guided-tour__skip"
            onClick={handleSkip}
            type="button"
          >
            Skip tour
          </button>
          <button
            className="btn-primary guided-tour__next"
            onClick={handleNext}
            type="button"
          >
            {isLast ? 'Done ✓' : 'Next →'}
          </button>
        </div>
        <div className="guided-tour__dots">
          {TOUR_STEPS.map((_, i) => (
            <span
              key={i}
              className={`guided-tour__dot ${i === step ? 'guided-tour__dot--active' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* HIGHLIGHT on sidebar item */}
      <div className={`guided-tour__highlight guided-tour__highlight--${current.target}`} />
    </>
  );
}
