import { useState } from "react";

import { logFrontendError } from "@/lib/utils";

export const useLoadingAction = (): {
  isLoading: boolean;
  executeWithLoading: (action: () => Promise<void>) => Promise<void>;
} => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const executeWithLoading = async (action: () => Promise<void>): Promise<void> => {
    try {
      setIsLoading(true);
      await action();
    } catch (error: any) {
      logFrontendError("Error executing action", error, error?.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, executeWithLoading };
};
