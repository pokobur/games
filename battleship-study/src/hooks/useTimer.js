import { useState, useEffect, useCallback } from 'react';

export const useTimer = (initialTimeMs = 10000, onTimeUp) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeMs);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 100) {
            setIsActive(false);
            if (onTimeUp) onTimeUp();
            return 0;
          }
          return time - 100;
        });
      }, 100);
    } else if (!isActive && timeLeft !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onTimeUp]);

  const startTimer = useCallback(() => setIsActive(true), []);
  const stopTimer = useCallback(() => setIsActive(false), []);
  const resetTimer = useCallback((newTime = initialTimeMs) => {
    setTimeLeft(newTime);
    setIsActive(false);
  }, [initialTimeMs]);

  return { timeLeft, isActive, startTimer, stopTimer, resetTimer };
};
