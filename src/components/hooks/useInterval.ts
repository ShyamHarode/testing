import { useEffect, useRef } from "react";

export const useInterval = (callback: () => void, delay: number | null): React.MutableRefObject<number | null> => {
  const intervalRef = useRef<number | null>(null);
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();
    if (typeof delay === "number") {
      intervalRef.current = window.setInterval(tick, delay);
      return () => {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
        }
      };
    }
  }, [delay]);

  return intervalRef;
};
