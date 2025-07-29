import { useState } from "react";

import { logFrontendError } from "@/lib/utils";

export const useLoadingAction = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const executeWithLoading = async (action: () => Promise<void>): Promise<void> => {
    try {
      setIsLoading(true);
      await action();
    } catch (error: unknown) {
      logFrontendError(
        "Error executing action",
        error,
        error instanceof Error ? error.message : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, executeWithLoading };
};
