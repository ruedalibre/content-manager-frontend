import { useTranslation } from "react-i18next";
import "./StepsGuide.scss";

type Props = {
  namespace?: string;
};

export default function StepsGuide({ namespace = "ideas" }: Props) {
  const { t } = useTranslation();

  const STEPS = [
    { n: 1, boldKey: `${namespace}.stepsGuide.step1_bold`, restKey: `${namespace}.stepsGuide.step1_rest` },
    { n: 2, boldKey: `${namespace}.stepsGuide.step2_bold`, restKey: `${namespace}.stepsGuide.step2_rest` },
    { n: 3, boldKey: `${namespace}.stepsGuide.step3_bold`, restKey: `${namespace}.stepsGuide.step3_rest` },
  ] as const;

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
