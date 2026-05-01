import { useState } from "react";
import { createPortal } from "react-dom";
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

// Spotlight positions — must match sidebar nav item positions
const SPOTLIGHT: Record<string, { top: number; left: number; width: number; height: number }> = {
  ideas:    { top: 140, left: 8, width: 240, height: 34 },
  contents: { top: 176, left: 8, width: 240, height: 34 },
  identity: { top: 212, left: 8, width: 240, height: 34 },
  activity: { top: 248, left: 8, width: 240, height: 34 },
};

const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.6)';

type Props = {
  onComplete: () => void;
};

export default function GuidedTour({ onComplete }: Props) {
  const [step, setStep] = useState(0);

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const spot = SPOTLIGHT[current.target];

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => onComplete();

  return createPortal(
    <>
      {/* SPOTLIGHT OVERLAY — 4 panels that leave the highlight area clear */}
      <div className="guided-tour__mask guided-tour__mask--top"
        style={{ top: 0, left: 0, right: 0, height: spot.top, background: OVERLAY_COLOR }} />
      <div className="guided-tour__mask guided-tour__mask--bottom"
        style={{ top: spot.top + spot.height, left: 0, right: 0, bottom: 0, background: OVERLAY_COLOR }} />
      <div className="guided-tour__mask guided-tour__mask--left"
        style={{ top: spot.top, left: 0, width: spot.left, height: spot.height, background: OVERLAY_COLOR }} />
      <div className="guided-tour__mask guided-tour__mask--right"
        style={{ top: spot.top, left: spot.left + spot.width, right: 0, height: spot.height, background: OVERLAY_COLOR }} />

      {/* HIGHLIGHT */}
      <div className={`guided-tour__highlight guided-tour__highlight--${current.target}`} />

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
    </>,
    document.body
  );
}
