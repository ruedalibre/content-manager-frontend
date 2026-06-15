import { useState, useRef, useId } from "react";
import "./Tooltip.scss";

type Props = {
  text: string;
  position?: "top" | "top-left";
  children: React.ReactNode;
};

export default function Tooltip({ text, position = "top", children }: Props) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const hideTimer = useRef<number | null>(null);

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  };

  const hide = () => {
    hideTimer.current = window.setTimeout(() => setVisible(false), 100);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setVisible(prev => !prev);
  };

  const handleTouchOutside = () => setVisible(false);

  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onTouchStart={handleTouchStart}
    >
      <span aria-describedby={visible ? id : undefined}>
        {children}
      </span>
      {visible && text && (
        <>
          <span className="tooltip-outside" onTouchStart={handleTouchOutside} />
          <span
            id={id}
            role="tooltip"
            className={`tooltip tooltip--${position}`}
          >
            {text}
            <span className="tooltip__arrow" aria-hidden="true" />
          </span>
        </>
      )}
    </span>
  );
}
