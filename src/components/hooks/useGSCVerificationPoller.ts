import { useCallback, useEffect, useRef, useState } from "react";

import { type Integration } from "@prisma/client";
import useSWR from "swr";

import { GSCIntegrationMetadata } from "@/features/google-search-console/helpers/metadata";
import { api, handleApiRequest } from "@/lib/utils";

type GSCPollResponse = {
  shouldStopPolling: boolean;
  integration: (Integration & { data: GSCIntegrationMetadata }) | null;
};

export const useGSCVerificationPoller = ({
  websiteId,
  integrationId,
  refreshInterval = 10000,
  onVerificationComplete,
  onNewIntegration,
  maxRetries = 60, // 10 minutes with 10s interval
  shouldPollOnMount = false,
}: {
  websiteId: string;
  integrationId: string | null;
  refreshInterval?: number;
  maxRetries?: number;
  onVerificationComplete: (integration: Integration & { data: GSCIntegrationMetadata }) => void;
  onNewIntegration: (integration: Integration & { data: GSCIntegrationMetadata }) => void;
  shouldPollOnMount?: boolean;
}) => {
  const [interval, setInterval] = useState(0);
  const url = `${process.env.NEXT_PUBLIC_API_HOST}/api/sites/${websiteId}/search-console/${integrationId}/poll`;
  const key = interval > 0 && integrationId ? url : null;
  const retryCountRef = useRef(0);

  const startPolling = useCallback(() => {
    retryCountRef.current = 0;
    setInterval(refreshInterval);
  }, [refreshInterval]);

  const stopPolling = useCallback(() => {
    setInterval(0);
  }, []);

  useEffect(() => {
    if (shouldPollOnMount) {
      startPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, error } = useSWR<GSCPollResponse>(
    key,
    async () => {
      retryCountRef.current += 1;

      const fallbackData: GSCPollResponse = {
        shouldStopPolling: false,
        integration: null,
      };

      const response = await handleApiRequest({
        makeRequest: async () => {
          const response = await api.get(url);
          return response.data;
        },
        hideErrorToast: true,
      } as any);

      return (response as GSCPollResponse) || fallbackData;
    },
    {
      refreshInterval: () => {
        if (retryCountRef.current >= maxRetries) {
          return 0; // Stop polling
        }
        return interval;
      },
      fallbackData: {
        shouldStopPolling: false,
        integration: null,
      },
      refreshWhenHidden: false,
      shouldRetryOnError: true,
      onSuccess: async (data) => {
        data.integration && onNewIntegration(data.integration);
        if (data.shouldStopPolling || data.integration?.data.verificationSuccessful) {
          data.integration && onVerificationComplete(data.integration);
          stopPolling();
        }
      },
    }
  );

  return {
    integration: data?.integration,
    shouldStopPolling: data?.shouldStopPolling ?? false,
    error,
    startPolling,
    stopPolling,
  };
};
