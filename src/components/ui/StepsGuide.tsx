import { useTranslation } from "react-i18next";
import "./StepsGuide.scss";

const STEPS = [
  { n: 1, boldKey: "ideas.stepsGuide.step1_bold", restKey: "ideas.stepsGuide.step1_rest" },
  { n: 2, boldKey: "ideas.stepsGuide.step2_bold", restKey: "ideas.stepsGuide.step2_rest" },
  { n: 3, boldKey: "ideas.stepsGuide.step3_bold", restKey: "ideas.stepsGuide.step3_rest" },
] as const;

export default function StepsGuide() {
  const { t } = useTranslation();
  return (
    <div className="steps-guide">
      {STEPS.map((step, i) => (
        <div key={step.n} className="steps-guide__item-wrap">
          <div className="steps-guide__step">
            <span className="steps-guide__number">{step.n}</span>
            <p className="steps-guide__text">
              <strong>{t(step.boldKey)}</strong>
              <span>{t(step.restKey)}</span>
            </p>
          </div>
          {i < STEPS.length - 1 && (
            <span className="steps-guide__divider" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}
