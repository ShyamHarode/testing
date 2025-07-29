import { useRef } from "react";

import axios from "axios";
import useSWR from "swr";

type InstagramOAuthResponse = {
  isAuthenticated: boolean;
  message: string;
};

export const useInstagramOAuthPoller = ({
  websiteId,
  refreshInterval = 0,
  onAuthComplete,
  maxRetries = 50,
  selectedProvider = "instagram",
  SMMToken,
}: {
  websiteId: string;
  refreshInterval?: number;
  maxRetries?: number;
  onAuthComplete: (_: InstagramOAuthResponse) => void;
  selectedProvider: string;
  SMMToken: string;
}) => {
  const url = `${process.env.NEXT_PUBLIC_API_HOST}/api/sites/${websiteId}/integrations/setup-options/${selectedProvider}?token=${SMMToken}`;
  const key = refreshInterval > 0 ? url : null;
  const retryCountRef = useRef(0);

  const { data, error } = useSWR(
    key,
    async () => {
      retryCountRef.current += 1;
      const { data } = await axios.get(url);
      return data as InstagramOAuthResponse;
    },
    {
      refreshInterval: () => {
        if (retryCountRef.current >= maxRetries) {
          return 0; // Stop polling
        }
        return refreshInterval;
      },
      fallbackData: {
        isAuthenticated: false,
        message: "",
      },
      refreshWhenHidden: false,
      shouldRetryOnError: true,
      onSuccess: async (data) => {
        if (data.isAuthenticated) {
          onAuthComplete(data);
        }
      },
    }
  );

  return {
    isAuthenticated: data?.isAuthenticated ?? false,
    message: data?.message ?? "",
    error,
  };
};
