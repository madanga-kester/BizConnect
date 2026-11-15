import { useEffect, useState } from "react";

/** A render-pure wall clock for UI that displays expiry/status information. */
export function useClock(refreshMs = 60_000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = setInterval(update, refreshMs);
    return () => clearInterval(interval);
  }, [refreshMs]);
  return now;
}
