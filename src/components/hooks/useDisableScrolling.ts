import { useEffect } from "react";

export const useDisableScrolling = (disabled: boolean): void => {
  useEffect(() => {
    if (disabled) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [disabled]);
};
