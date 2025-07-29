import { useEffect, useState } from "react";

import { useSpring } from "framer-motion";

import { useInterval } from "./useInterval";

type ProgressState = "initial" | "in-progress" | "completing" | "complete";

export default function useProgress() {
  const [state, setState] = useState<ProgressState>("initial");

  let value = useSpring(0, {
    damping: 25,
    mass: 0.5,
    stiffness: 300,
    restDelta: 0.1,
  });

  useInterval(
    () => {
      // If we start progress but the bar is currently complete, reset it first.
      if (value.get() === 100) {
        value.jump(0);
      }

      let current = value.get();

      let diff;
      if (current === 0) {
        diff = 15;
      } else if (current < 50) {
        diff = rand(1, 10);
      } else {
        diff = rand(1, 5);
      }

      value.set(Math.min(current + diff, 99));
    },
    state === "in-progress" ? 750 : null
  );

  useEffect(() => {
    if (state === "initial") {
      value.jump(0);
    } else if (state === "completing") {
      value.set(100);
    }

    return value.on("change", (latest: number) => {
      if (latest === 100) {
        setState("complete");
      }
    });
  }, [value, state]);

  function reset(): void {
    setState("initial");
  }

  function start(): void {
    setState("in-progress");
  }

  function done(): void {
    setState((state) => (state === "initial" || state === "in-progress" ? "completing" : state));
  }

  return { state, value, start, done, reset };
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
