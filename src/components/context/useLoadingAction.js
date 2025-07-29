import { logFrontendError } from "@/lib/utils";
import { useState } from "react";

export const useLoadingAction = () => {
  const [isLoading, setIsLoading] = useState(false);

  const executeWithLoading = async (action) => {
    try {
      setIsLoading(true);
      await action();
    } catch (error) {
      logFrontendError("Error executing action", error, error?.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, executeWithLoading };
};
