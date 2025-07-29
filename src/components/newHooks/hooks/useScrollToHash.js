import { useEffect } from "react";

export function useScrollToHash(scrollSpyItems = [], delay = 500) {
  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      const matchingItem = scrollSpyItems?.find((item) => item.id === hash);

      if (matchingItem) {
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, delay);
      }
    }
  }, [scrollSpyItems, delay]);
}
