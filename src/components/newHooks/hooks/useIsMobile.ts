import { useEffect, useState } from "react";

export default function useIsMobile() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkIfMobile = (): void => {
      const isMobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
        navigator.userAgent
      );

      const isSmallScreen = window.innerWidth <= 768;

      const isTouchAndSmall = ("ontouchstart" in window || navigator.maxTouchPoints > 0) && isSmallScreen;

      setIsMobileDevice(isMobileUserAgent && isTouchAndSmall);
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
