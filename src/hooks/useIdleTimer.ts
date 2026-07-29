import { useCallback, useEffect, useRef, useState } from "react";

const IDLE_TIMEOUT_MS = 55 * 60 * 1000; // 55 minutos hasta mostrar el aviso
const WARNING_DURATION_MS = 5 * 60 * 1000; // 5 minutos de gracia tras el aviso

const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
] as const;

export function useIdleTimer(onTimeout: () => void) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_DURATION_MS / 1000);

  // Ref espejo de showWarning — permite que el listener de actividad
  // (registrado una sola vez) lea el valor MÁS RECIENTE sin que el
  // useEffect necesite depender de showWarning y re-montarse cada vez
  // que cambia (eso era lo que causaba el parpadeo: cada cambio de
  // showWarning reiniciaba el efecto completo, que a su vez llamaba
  // resetTimer() y volvía a poner showWarning en false de inmediato)
  const showWarningRef = useRef(false);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const startWarningCountdown = useCallback(() => {
    showWarningRef.current = true;
    setShowWarning(true);
    setSecondsLeft(WARNING_DURATION_MS / 1000);

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimers();
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimers, onTimeout]);

  const resetTimer = useCallback(() => {
    clearTimers();
    showWarningRef.current = false;
    setShowWarning(false);
    idleTimerRef.current = setTimeout(startWarningCountdown, IDLE_TIMEOUT_MS);
  }, [clearTimers, startWarningCountdown]);

  useEffect(() => {
    resetTimer();

    const handleActivity = () => {
      // Lee el valor MÁS RECIENTE vía ref, no vía closure del useEffect
      if (showWarningRef.current) return;
      resetTimer();
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity),
    );

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleActivity),
      );
    };
    // Se ejecuta UNA sola vez al montar — sin showWarning en las
    // dependencias, ya no se re-monta en cada cambio de estado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stayActive = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return { showWarning, secondsLeft, stayActive };
}
