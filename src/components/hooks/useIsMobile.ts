import { useEffect, useState } from "react";

export default function useIsMobile() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileDevice(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent)
      );
    };

    checkIfMobile();

    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  return {
    isMobileDevice,
  };
}
