import React, { createContext, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";

import confetti from "canvas-confetti";

import { Button } from "@/components/ui/button";

import type { Options as ConfettiOptions } from "canvas-confetti";
import type { ButtonProps } from "@/components/ui/button";

interface ConfettiApi {
  fire: (opts?: Partial<ConfettiOptions>) => void;
}

const ConfettiContext = createContext<ConfettiApi>({
  fire: () => {},
});

interface ConfettiProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  options?: Partial<ConfettiOptions>;
  globalOptions?: {
    resize?: boolean;
    useWorker?: boolean;
  };
  manualstart?: boolean;
  children?: React.ReactNode;
}

const Confetti = forwardRef<ConfettiApi, ConfettiProps>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, children, ...rest } = props;
  const instanceRef = useRef<confetti.CreateTypes | null>(null); // confetti instance

  const canvasRef = useCallback(
    // https://react.dev/reference/react-dom/components/common#ref-callback
    // https://reactjs.org/docs/refs-and-the-dom.html#callback-refs
    (node: HTMLCanvasElement | null) => {
      if (node !== null) {
        // <canvas> is mounted => create the confetti instance
        if (instanceRef.current) return; // if not already created
        instanceRef.current = confetti.create(node, {
          ...globalOptions,
          resize: true,
        });
      } else {
        // <canvas> is unmounted => reset and destroy instanceRef
        if (instanceRef.current) {
          instanceRef.current.reset();
          instanceRef.current = null;
        }
      }
    },
    [globalOptions]
  );

  // `fire` is a function that calls the instance() with `opts` merged with `options`
  const fire = useCallback(
    (opts: Partial<ConfettiOptions> = {}) => instanceRef.current?.({ ...options, ...opts }),
    [options]
  );

  const api: ConfettiApi = useMemo(
    () => ({
      fire,
    }),
    [fire]
  );

  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    if (!manualstart) {
      fire();
    }
  }, [manualstart, fire]);

  return (
    <ConfettiContext.Provider value={api}>
      <canvas ref={canvasRef} {...rest} />
      {children}
    </ConfettiContext.Provider>
  );
});

interface ConfettiButtonProps extends ButtonProps {
  options?: Partial<ConfettiOptions>;
  children?: React.ReactNode;
}

function ConfettiButton({ options, children, ...props }: ConfettiButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    confetti({
      ...options,
      origin: {
        x: x / window.innerWidth,
        y: y / window.innerHeight,
      },
    });
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}

Confetti.displayName = "Confetti";

export { Confetti, ConfettiButton, type ConfettiApi, type ConfettiButtonProps, type ConfettiProps };

export default Confetti;
