import { useEffect } from "react";

export default function useDisableScrolling(): void {
  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, []);
}
