import { useEffect, useState } from 'react';

export function useCountdown(expiresAt: string) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return secondsLeft;
}
